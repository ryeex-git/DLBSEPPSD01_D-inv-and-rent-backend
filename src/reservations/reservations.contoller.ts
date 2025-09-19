import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private svc: ReservationsService) {}
  @Get()
  list(@Query() q: ListReservationsDto) {
    return this.svc.list(q);
  }

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.svc.create(dto);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.svc.approve(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancel(id);
  }
}
