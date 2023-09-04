import { Controller, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { DriverService } from './driver.service';

@Controller('drivers')
export class DriverController {
  constructor(private driverService: DriverService) {}

  //toggle availability
  @Put('me/toggle-availability')
  toggleAvailability(@Req() request: Request) {
    return this.driverService.toggleAvailability(request['auth'].id);
  }
}
