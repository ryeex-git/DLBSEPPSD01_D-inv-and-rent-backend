import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Payload zum Ausgeben eines Items (Loan anlegen).
 *
 * @remarks
 * - Wird von `POST /loans/issue` verwendet.
 * - `dueAt` muss **nach** dem aktuellen Zeitpunkt liegen (fachlich in `LoansService.issue()` geprüft).
 * - Zeiten im ISO-8601-Format; UTC empfohlen.
 */
export class IssueLoanDto {
  /** ID des Items, das ausgegeben werden soll. */
  @ApiProperty({
    description: 'Item-ID (muss > 0 sein)',
    type: Number,
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId!: number;

  /** Fälligkeit der Ausleihe (Ende des Ausleihzeitraums). */
  @ApiProperty({
    description:
      'Fälligkeitszeitpunkt (ISO 8601, z. B. 2025-09-16T19:00:00.000Z)',
    example: '2025-09-16T19:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  dueAt!: string;

  /** Optionale Notiz. */
  @ApiPropertyOptional({
    description: 'Optionale Notiz zur Ausleihe',
    example: 'Für Kundentermin',
  })
  @IsOptional()
  @IsString()
  note?: string;

  /** Optional: Name des ausleihenden Nutzers. */
  @ApiPropertyOptional({
    description: 'Name des ausleihenden Nutzers',
    example: 'Max Mustermann',
  })
  @IsOptional()
  @IsString()
  userName?: string;
}
