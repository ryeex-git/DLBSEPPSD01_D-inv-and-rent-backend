/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminPinGuard } from '../common/admin-pin.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Get() list() {
    return this.svc.list();
  }

  @UseGuards(AdminPinGuard)
  @Post()
  create(@Body('name') name: string) {
    return this.svc.create(name);
  }

  @UseGuards(AdminPinGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
