import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservation.dto';
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiSecurity,
} from '@nestjs/swagger';

/**
 * HTTP-Controller für Reservierungen.
 *
 * Endpunkte:
 * - `GET /reservations` – Liste paginiert/filtern/sortieren
 * - `POST /reservations` – Reservierung anlegen (mit Konfliktprüfung)
 * - `POST /reservations/:id/approve` – Reservierung genehmigen (Admin)
 * - `POST /reservations/:id/cancel`  – Reservierung stornieren (Admin)
 *
 * @remarks
 * - Validierung/Transformation läuft global über `ValidationPipe` (in `main.ts`).
 * - Admin-Endpunkte erwarten den Header **`x-admin-pin`** (Swagger Security: `AdminPin`).
 */
@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private svc: ReservationsService) {}

  /**
   * Liefert eine paginierte Liste von Reservierungen.
   *
   * Unterstützte Filter: Status (`PENDING|APPROVED|CANCELLED`), Zeitraum `[from,to)`,
   * Textsuche über `userName`, `note`, `item.name`, `item.inventoryNo`.
   *
   * @param q Query-Parameter (Seite, Größe, Sortierung, Filter)
   */
  @Get()
  @ApiOperation({
    summary: 'Reservierungen auflisten (paginiert/filtern/sortieren)',
  })
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
  @ApiBadRequestResponse({
    description: 'Ungültiger Filter (z. B. Datumsbereich)',
  })
  list(@Query() q: ListReservationsDto) {
    return this.svc.list(q);
  }

  /**
   * Legt eine neue Reservierung an.
   *
   * Führt eine Konfliktprüfung gegen laufende Ausleihen und genehmigte Reservierungen durch.
   *
   * @param dto Item/Zeitraum/optional Notiz+Benutzername
   */
  @Post()
  @ApiOperation({ summary: 'Reservierung anlegen (mit Konfliktprüfung)' })
  @ApiCreatedResponse({ description: 'Reservierung angelegt' })
  @ApiBadRequestResponse({
    description: 'Item fehlt, Intervall ungültig oder Zeitraum belegt',
  })
  create(@Body() dto: CreateReservationDto) {
    return this.svc.create(dto);
  }

  /**
   * Genehmigt eine bestehende Reservierung (Admin).
   *
   * Prüft vor dem Statuswechsel erneut auf Überlappungen.
   *
   * @param id ID der Reservierung
   */
  @Post(':id/approve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reservierung genehmigen (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiOkResponse({ description: 'Reservierung genehmigt' })
  @ApiBadRequestResponse({
    description: 'Konflikt oder unzulässiger Statuswechsel',
  })
  @ApiNotFoundResponse({ description: 'Reservierung nicht gefunden' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.svc.approve(id);
  }

  /**
   * Storniert eine bestehende Reservierung (Admin).
   *
   * @param id ID der Reservierung
   */
  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reservierung stornieren (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiOkResponse({ description: 'Reservierung storniert' })
  @ApiNotFoundResponse({ description: 'Reservierung nicht gefunden' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancel(id);
  }
}
