import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListItemsDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 10;

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'status' | 'categoryName';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsOptional()
  categoryId?: number;

  @IsOptional()
  @IsIn(['OK', 'DEFECT', 'OUT'])
  status?: 'OK' | 'DEFECT' | 'OUT';
}
