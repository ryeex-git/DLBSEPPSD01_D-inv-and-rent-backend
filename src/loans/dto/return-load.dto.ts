import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Payload zum Zurücknehmen eines Items (offenen Loan schließen).
 *
 * @remarks
 * - Wird von `POST /loans/return` verwendet.
 * - Die globale `ValidationPipe` (transform + enableImplicitConversion) wandelt
 *   numerische Strings in Zahlen; `@Type(() => Number)` macht das explizit klar.
 */
export class ReturnLoanDto {
  /** ID des Items, dessen offener Loan geschlossen werden soll. */
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
}
