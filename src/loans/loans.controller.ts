import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { IssueLoanDto } from './dto/issue-load.dto';
import { ReturnLoanDto } from './dto/return-load.dto';
import { AdminPinGuard } from '../common/admin-pin.guard';

@Controller('loans')
@UseGuards(AdminPinGuard)
export class LoansController {
  constructor(private svc: LoansService) {}

  @Post('issue') issue(@Body() dto: IssueLoanDto) {
    return this.svc.issue(dto);
  }
  @Post('return') returnItem(@Body() dto: ReturnLoanDto) {
    return this.svc.returnItem(dto);
  }
}
