import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class IssueLoanDto {
  @IsInt() itemId!: number;
  @IsDateString() dueAt!: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() userName?: string;
}
