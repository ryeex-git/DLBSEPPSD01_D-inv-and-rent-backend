import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReservationDto {
  @IsInt() @Min(1) itemId!: number;
  @IsDateString() start!: string;
  @IsDateString() end!: string;
  @IsOptional() @IsString() @MinLength(0) note?: string;
  @IsOptional() @IsString() userName?: string;
}
