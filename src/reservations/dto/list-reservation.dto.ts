import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListReservationsDto {
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
  sortBy?: 'startAt' | 'endAt' | 'status' | 'itemName';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @IsOptional() @IsString() search?: string;
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'CANCELLED'])
  status?: 'PENDING' | 'APPROVED' | 'CANCELLED';

  // YYYY-MM-DD
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}
