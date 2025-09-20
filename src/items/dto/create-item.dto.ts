import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum ItemStatus {
  OK = 'OK',
  DEFECT = 'DEFECT',
  OUT = 'OUT',
}

/**
 * DTO zum Anlegen eines Items.
 *
 * @remarks
 * - Eindeutigkeit von `inventoryNo` (Inventarnummer) ggf. per DB-Constraint sicherstellen.
 * - `tagsCsv` ist ein einfacher CSV-String (z. B. `"akku, werkzeug"`).
 */
export class CreateItemDto {
  @ApiProperty({
    description: 'Name des Items',
    example: 'Akkuschrauber',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Inventarnummer',
    example: 'INV-1001',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  inventoryNo!: string;

  @ApiPropertyOptional({
    description: 'Kategorie-ID (optional)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Zustand als freier Text (z. B. "OK" oder "DEFECT")',
    example: 'OK',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  condition?: string;

  @ApiPropertyOptional({
    description: 'Tags als CSV (Komma-getrennt)',
    example: 'akku, werkzeug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagsCsv?: string;
}

/**
 * DTO zum Aktualisieren eines Items.
 *
 * @remarks
 * - Alle Felder optional; nur übergebene Felder werden geändert.
 */
export class UpdateItemDto {
  @ApiPropertyOptional({
    description: 'Name des Items',
    example: 'Akkuschrauber (Set)',
    minLength: 2,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Zustand als freier Text (z. B. "OK" oder "DEFECT")',
    example: 'DEFECT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  condition?: string;

  @ApiPropertyOptional({
    description: 'Kategorie-ID',
    example: 2,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Status (betriebsbereit/defekt/aktuell verliehen)',
    enum: ItemStatus,
    example: ItemStatus.OK,
  })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiPropertyOptional({
    description: 'Tags als CSV (Komma-getrennt)',
    example: 'akku, werkzeug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagsCsv?: string;
}
