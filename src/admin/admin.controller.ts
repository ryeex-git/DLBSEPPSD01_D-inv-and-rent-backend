import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminPinGuard } from '../common/admin-pin.guard';

@UseGuards(AdminPinGuard)
@Controller('admin')
export class AdminController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}
