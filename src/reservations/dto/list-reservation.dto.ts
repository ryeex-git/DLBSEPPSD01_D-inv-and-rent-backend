import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query-DTO zum Auflisten von Reservierungen.
 *
 * Unterstützte Filter/Sortierung:
 * - Pagination: `page` (0-basiert), `pageSize`
 * - Sortierung: `sortBy` ∈ { startAt, endAt, status, itemName }, `sortDir` ∈ { asc, desc }
 * - Textsuche: `search` über userName, note, item.name, item.inventoryNo
 * - Zeitraum: `[from, to)` als `YYYY-MM-DD` (Start inkl., Ende exkl.)
 *
 * @remarks
 * - Werte werden durch die globale `ValidationPipe` transformiert (String → Number).
 * - Standardwerte: `page=0`, `pageSize=10`.
 */
export class ListReservationsDto {
  /** Seite (0-basiert). */
  @ApiPropertyOptional({
    description: 'Seite (0-basiert).',
    type: Number,
    minimum: 0,
    default: 0,
    example: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page = 0;

  /** Anzahl Einträge pro Seite. */
  @ApiPropertyOptional({
    description: 'Einträge pro Seite.',
    type: Number,
    minimum: 1,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 10;

  /** Sortierfeld. */
  @ApiPropertyOptional({
    description: 'Sortierfeld.',
    enum: ['startAt', 'endAt', 'status', 'itemName'],
    example: 'startAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'startAt' | 'endAt' | 'status' | 'itemName';

  /** Sortierrichtung. */
  @ApiPropertyOptional({
    description: 'Sortierrichtung.',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  /** Volltextsuche (userName, note, item.name, item.inventoryNo). */
  @ApiPropertyOptional({
    description:
      'Volltextsuche (userName, note, item.name, item.inventoryNo). Case-insensitive.',
    example: 'kamera',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /** Status-Filter. */
  @ApiPropertyOptional({
    description: 'Filter nach Status.',
    enum: ['PENDING', 'APPROVED', 'CANCELLED'],
    example: 'APPROVED',
  })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'CANCELLED'])
  status?: 'PENDING' | 'APPROVED' | 'CANCELLED';

  /**
   * Start des Zeitfensters (inklusive), Format `YYYY-MM-DD`.
   * In der Service-Logik auf 00:00:00Z normalisiert.
   */
  @ApiPropertyOptional({
    description: 'Start des Zeitfensters (inklusive), Format YYYY-MM-DD.',
    example: '2025-09-01',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  from?: string;

  /**
   * Ende des Zeitfensters (exklusive), Format `YYYY-MM-DD`.
   * In der Service-Logik auf 00:00:00Z normalisiert.
   */
  @ApiPropertyOptional({
    description: 'Ende des Zeitfensters (exklusive), Format YYYY-MM-DD.',
    example: '2025-09-30',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  to?: string;
}
