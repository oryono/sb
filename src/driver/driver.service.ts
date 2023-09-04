import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService) {}

  async toggleAvailability(id: number) {
    // update driver availability
    const driver = await this.prisma.driver.findFirst({ where: { id } });

    return await this.prisma.driver.update({
      where: { id },
      data: { is_available: !driver.is_available },
    });
  }
}
