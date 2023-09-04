import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
} from '@nestjs/common';
import { RideService } from './ride.service';
import { UpdateDto } from './dto';

@Controller('rides')
export class RideController {
  constructor(private rideService: RideService) {}

  @Get('/')
  listAll() {
    return this.rideService.getAll();
  }

  @Put(':id/accept')
  accept(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
    return this.rideService.accept(id, request['auth'].id);
  }

  @Put(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.rideService.complete(id);
  }

  @Put(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.rideService.cancel(id);
  }
}
