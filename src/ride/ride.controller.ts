import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
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
  accept(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDto) {
    console.log(body);
    return this.rideService.accept(id, body);
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
