import { IsInt } from 'class-validator';
export class ReturnLoanDto {
  @IsInt() itemId!: number;
}
