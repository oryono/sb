import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthDto, RegistrationDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import * as process from 'process';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerUser(registerDto: RegistrationDto) {
    const password = await argon.hash(registerDto.password);
    try {
      return await this.prisma.user.create({
        data: { ...registerDto, password: password },
      });
    } catch (error) {
      console.log(error);
      if (error.code == 'P2002') {
        throw new ConflictException('Email or phone already taken');
      }

      throw error;
    }
  }

  async loginUser(authDto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        phone: authDto.phone,
      },
    });

    if (!user) {
      throw new ForbiddenException('Invalid Credentials');
    }

    const match = await argon.verify(user.password, authDto.password);

    if (!match) {
      throw new ForbiddenException('Invalid Credentials');
    }

    const payload = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
    };
    return {
      token: await this.jwtService.signAsync(payload, {
        expiresIn: '2h',
        secret: process.env.JWT_SECRET,
      }),
      user: payload,
    };
  }

  async registerDriver(registerDto: RegistrationDto) {
    const password = await argon.hash(registerDto.password);
    try {
      return await this.prisma.driver.create({
        data: { ...registerDto, password: password },
      });
    } catch (error) {
      console.log(error);
      if (error.code == 'P2002') {
        throw new ConflictException('Email or phone already taken');
      }

      throw error;
    }
  }

  async loginDriver(authDto: AuthDto) {
    const driver = await this.prisma.driver.findUnique({
      where: {
        phone: authDto.phone,
      },
    });

    if (!driver) {
      throw new ForbiddenException('Invalid Credentials');
    }

    const match = await argon.verify(driver.password, authDto.password);

    if (!match) {
      throw new ForbiddenException('Invalid Credentials');
    }

    const payload = {
      id: driver.id,
      firstname: driver.firstname,
      lastname: driver.lastname,
      email: driver.email,
      phone: driver.phone,
    };
    return {
      token: await this.jwtService.signAsync(payload, {
        expiresIn: '2h',
        secret: process.env.JWT_SECRET,
      }),
      user: payload,
    };
  }
}
