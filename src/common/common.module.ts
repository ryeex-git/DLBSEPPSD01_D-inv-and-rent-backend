import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AdminPinGuard } from './admin-pin.guard';

@Global()
@Module({
  providers: [AuditService, AdminPinGuard],
  exports: [AuditService, AdminPinGuard],
})
export class CommonModule {}
