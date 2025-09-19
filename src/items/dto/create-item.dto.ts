import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum ItemStatus {
  OK = 'OK',
  DEFECT = 'DEFECT',
  OUT = 'OUT',
}

export class CreateItemDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) inventoryNo!: string;
  @IsOptional() @IsInt() categoryId?: number;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() tagsCsv?: string; // CSV für Einfachheit
}

export class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsInt() categoryId?: number;
  @IsOptional() @IsEnum(ItemStatus) status?: ItemStatus;
  @IsOptional() @IsString() tagsCsv?: string;
}
