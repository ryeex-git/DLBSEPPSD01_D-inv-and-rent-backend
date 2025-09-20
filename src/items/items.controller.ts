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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

/**
 * HTTP-Controller für Items (Inventar).
 *
 * Endpunkte:
 * - `GET /items` – Liste (paginiert/filtern/sortieren)
 * - `GET /items/:id` – einzelnes Item
 * - `POST /items` – Item anlegen (**Admin**, Header `x-admin-pin`)
 * - `PUT /items/:id` – Item aktualisieren (**Admin**)
 * - `DELETE /items/:id` – Item löschen (**Admin**)
 * - `GET /items/:id/history` – Audit-Historie
 * - `GET /items/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` – Verfügbarkeits-Spannen
 */
@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(
    private svc: ItemsService,
    private audit: AuditService,
  ) {}

  /** Liste der Items (paginiert/Filter/Sortierung). */
  @Get()
  @ApiOperation({ summary: 'Items auflisten (paginiert/filtern/sortieren)' })
  @ApiOkResponse({
    description: 'Liste mit total-Zähler',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
      },
    },
  })
  list(@Query() q: ListItemsDto) {
    return this.svc.list(q);
  }

  /** Einzelnes Item abrufen. */
  @Get(':id')
  @ApiOperation({ summary: 'Einzelnes Item abrufen' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Item gefunden' })
  @ApiNotFoundResponse({ description: 'Item nicht gefunden' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  /** Item anlegen (Admin). */
  @UseGuards(AdminPinGuard)
  @Post()
  @ApiOperation({ summary: 'Item anlegen (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiCreatedResponse({ description: 'Item angelegt' })
  async create(@Body() dto: CreateItemDto) {
    const it = await this.svc.create(dto);
    await this.audit.log(it.id, 'ITEM_CREATE', 'admin');
    return it;
  }

  /** Item aktualisieren (Admin). */
  @UseGuards(AdminPinGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Item aktualisieren (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Item aktualisiert' })
  @ApiNotFoundResponse({ description: 'Item nicht gefunden' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    const it = await this.svc.update(id, dto);
    await this.audit.log(id, 'ITEM_UPDATE', 'admin');
    return it;
  }

  /** Item löschen (Admin). */
  @UseGuards(AdminPinGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Item löschen (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Item gelöscht' })
  @ApiNotFoundResponse({ description: 'Item nicht gefunden' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.audit.log(id, 'ITEM_DELETE', 'admin');
    return this.svc.remove(id);
  }

  /** Audit-Historie eines Items. */
  @Get(':id/history')
  @ApiOperation({ summary: 'Audit-Historie eines Items' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Historie (neueste zuerst)' })
  @ApiNotFoundResponse({ description: 'Item nicht gefunden' })
  history(@Param('id', ParseIntPipe) id: number) {
    return this.svc.history(id);
  }

  /**
   * Verfügbarkeitsdaten (Loans/Reservierungen) als Spannen für die Timeline.
   * `from` inklusiv, `to` exklusiv (Format `YYYY-MM-DD`).
   */
  @Get(':id/availability')
  @ApiOperation({
    summary:
      'Verfügbarkeit eines Items (Timeline-Spannen aus Loans/Reservierungen)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiQuery({
    name: 'from',
    required: true,
    example: '2025-09-15',
    description: 'Starttag (inklusive), Format YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    example: '2025-10-06',
    description: 'Endtag (exklusive), Format YYYY-MM-DD',
  })
  @ApiOkResponse({
    description: 'Array von Spannen',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['LOAN', 'RESERVATION'] },
          status: {
            type: 'string',
            nullable: true,
            enum: ['RETURNED', 'APPROVED', 'PENDING', 'CANCELLED'],
          },
          label: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'from/to fehlen oder Bereich ungültig',
  })
  @ApiNotFoundResponse({ description: 'Item nicht gefunden' })
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
