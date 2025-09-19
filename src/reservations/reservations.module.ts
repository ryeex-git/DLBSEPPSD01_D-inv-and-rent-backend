import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.contoller';
import { AdminPinGuard } from 'src/common/admin-pin.guard';
import { PrismaService } from 'src/common/prisma.service';
import { AuditService } from 'src/common/audit.service';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, AdminPinGuard, PrismaService, AuditService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
