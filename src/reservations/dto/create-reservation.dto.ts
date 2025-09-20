import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Payload zum Anlegen einer Reservierung.
 *
 * @remarks
 * - Zeitintervall wird als **halb-offen** interpretiert: `[start, end)`.
 *   D. h. `start` inklusiv, `end` exklusiv.
 * - Die Logik (Service) validiert zusätzlich `start < end` und prüft Konflikte
 *   mit Ausleihen/genehmigten Reservierungen.
 * - `ValidationPipe` (transform + enableImplicitConversion) wandelt numerische
 *   Strings automatisch in Zahlen; `@Type(() => Number)` ist optional, aber explizit.
 */
export class CreateReservationDto {
  /** Ziel-Item der Reservierung. */
  @ApiProperty({
    description: 'ID des Items',
    type: Number,
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId!: number;

  /** Startzeitpunkt (inklusive) im ISO-Format. */
  @ApiProperty({
    description: 'Start (inklusive) – ISO 8601',
    example: '2025-09-16T18:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  start!: string;

  /** Endzeitpunkt (exklusive) im ISO-Format. */
  @ApiProperty({
    description: 'Ende (exklusive) – ISO 8601',
    example: '2025-09-16T19:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  end!: string;

  /** Optionale Notiz des/der Anfragenden. */
  @ApiPropertyOptional({
    description: 'Optionale Notiz',
    example: 'Für Kundentermin',
  })
  @IsOptional()
  @IsString()
  @MinLength(0)
  note?: string;

  /** Optional: Name des Nutzers/der Nutzerin, der/die reserviert. */
  @ApiPropertyOptional({
    description: 'Name des Nutzers/der Nutzerin',
    example: 'Max Mustermann',
  })
  @IsOptional()
  @IsString()
  userName?: string;
}
