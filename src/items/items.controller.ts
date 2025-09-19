/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto/create-item.dto';
import { AdminPinGuard } from '../common/admin-pin.guard';
import { AuditService } from '../common/audit.service';
import { ListItemsDto } from './dto/list-items.dto';

@Controller('items')
export class ItemsController {
  constructor(
    private svc: ItemsService,
    private audit: AuditService,
  ) {}

  @Get()
  list(@Query() q: ListItemsDto) {
    return this.svc.list(q);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @UseGuards(AdminPinGuard)
  @Post()
  async create(@Body() dto: CreateItemDto) {
    const it = await this.svc.create(dto);
    await this.audit.log(it.id, 'ITEM_CREATE', 'admin');
    return it;
  }

  @UseGuards(AdminPinGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    const it = await this.svc.update(id, dto);
    await this.audit.log(id, 'ITEM_UPDATE', 'admin');
    return it;
  }

  @UseGuards(AdminPinGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.audit.log(id, 'ITEM_DELETE', 'admin');
    return this.svc.remove(id);
  }

  @Get(':id/history')
  history(@Param('id', ParseIntPipe) id: number) {
    return this.svc.history(id);
  }

  @Get(':id/availability')
  async getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to)
      throw new BadRequestException(
        'Query "from" und "to" sind erforderlich (YYYY-MM-DD).',
      );

    const exists = await this.svc.exists(id);
    if (!exists) throw new NotFoundException('Item not found');

    return this.svc.getAvailability(id, from, to);
  }
}
