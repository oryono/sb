import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RideService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.ride.findMany();
  }

  async accept(rideId: number, driverId: number) {
    // Check if ride is accepted. Can only accept rides that are pending
    // Find ride
    const ride = await this.prisma.ride.findFirst({
      where: {
        id: rideId,
      },
    });

    // Make sure ride exists
    if (!ride) {
      throw new NotFoundException('Ride is not found');
    }

    // Make sure ride is pending state. We can only accept pending rides
    if (
      ride.status == 'accepted' ||
      ride.status == 'completed' ||
      ride.status == 'canceled'
    ) {
      throw new BadRequestException(
        'Ride is either accepted, canceled or has not been completed by driver',
      );
    }

    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (!driver.is_available) {
      throw new BadRequestException('Driver is not available');
    }

    try {
      await this.prisma.$transaction(async () => {
        await this.prisma.ride.update({
          where: {
            id: rideId,
          },

          data: {
            status: 'accepted',
            driver_id: driverId,
          },
        });

        await this.prisma.driver.update({
          where: {
            id: driver.id,
          },

          data: {
            is_available: false,
          },
        });
      });

      return { message: 'Successfully accepted ride' };
    } catch (error) {
      if (error.code == 'P2003') {
        throw new ConflictException('Foreign Key Constraint Error');
      }
    }
  }

  async complete(id: number) {
    // Check if ride is accepted. Can only complete rides that are completed
    // Find ride

    const ride = await this.prisma.ride.findFirst({
      where: {
        id: id,
      },
    });

    // Make sure ride exists
    if (!ride) {
      throw new NotFoundException('Ride is not found');
    }

    // Make sure ride is accepted state. We can only complete accepted rides
    if (
      ride.status == 'completed' ||
      ride.status == 'pending' ||
      ride.status == 'canceled'
    ) {
      throw new BadRequestException(
        'Ride is either complete, canceled or has not been accepted by rider',
      );
    }

    try {
      await this.prisma.$transaction(async () => {
        await this.prisma.ride.update({
          where: {
            id: ride.id,
          },
          data: {
            status: 'completed',
          },
        });
        // Make rider available again
        await this.prisma.driver.update({
          where: {
            id: ride.driver_id,
          },

          data: {
            is_available: true,
          },
        });
      });

      return { message: 'Ride completed' };
    } catch (error) {
      // console.log(error);
    }
  }

  async cancel(id: number) {
    // A ride is canceled by a user who has changed his/ her mind on an accepted ride
    // So we make sure it's a ride that exists
    // And it's been accepted

    const ride = await this.prisma.ride.findFirst({
      where: {
        id: id,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride is not found');
    }

    // Ride must be in accepted state
    if (
      ride.status == 'canceled' ||
      ride.status == 'pending' ||
      ride.status == 'completed'
    ) {
      throw new BadRequestException(
        'Ride is already canceled, completed or has not been accepted by rider',
      );
    }

    try {
      await this.prisma.$transaction(async () => {
        await this.prisma.ride.update({
          where: {
            id: ride.id,
          },
          data: {
            status: 'canceled',
          },
        });
        // Make rider available again
        await this.prisma.driver.update({
          where: {
            id: ride.driver_id,
          },

          data: {
            is_available: true,
          },
        });
      });

      return { message: 'Ride canceled' };
    } catch (error) {
      // console.log(error);
    }
  }
}
