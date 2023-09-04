import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DriverModule } from './driver/driver.module';
import { RideModule } from './ride/ride.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    UserModule,
    DriverModule,
    RideModule,
    PrismaModule,
    ConfigModule.forRoot(),
  ],
  providers: [],
})
export class AppModule {}
