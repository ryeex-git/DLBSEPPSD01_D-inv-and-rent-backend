import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { AdminPinGuard } from 'src/common/admin-pin.guard';

@Module({
  controllers: [LoansController],
  providers: [LoansService, AdminPinGuard],
})
export class LoansModule {}
