import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query-DTO für die Items-Liste.
 *
 * Unterstützt:
 * - Pagination: `page` (0-basiert), `pageSize`
 * - Sortierung: `sortBy` ∈ { name, status, categoryName }, `sortDir` ∈ { asc, desc }
 * - Suche: `search` (mehrere Begriffe durch Leerzeichen → Service macht AND aus OR-Blöcken)
 * - Filter: `categoryId`, `status`
 *
 * Hinweis: Mit SQLite ist `contains` i. d. R. **case-sensitiv** (kein `mode: 'insensitive'`).
 */
export class ListItemsDto {
  @ApiPropertyOptional({
    description: 'Seite (0-basiert)',
    type: Number,
    minimum: 0,
    default: 0,
    example: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page = 0;

  @ApiPropertyOptional({
    description: 'Einträge pro Seite',
    type: Number,
    minimum: 1,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 10;

  @ApiPropertyOptional({
    description: 'Sortierfeld',
    enum: ['name', 'status', 'categoryName'],
    example: 'name',
  })
  @IsOptional()
  @IsIn(['name', 'status', 'categoryName'])
  sortBy?: 'name' | 'status' | 'categoryName';

  @ApiPropertyOptional({
    description: 'Sortierrichtung',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Volltextsuche (mehrere Begriffe mit Leerzeichen trennen)',
    example: 'akku kamera',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Kategorie-ID (Filter)',
    type: Number,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Status-Filter',
    enum: ['OK', 'DEFECT', 'OUT'],
    example: 'OK',
  })
  @IsOptional()
  @IsIn(['OK', 'DEFECT', 'OUT'])
  status?: 'OK' | 'DEFECT' | 'OUT';
}
