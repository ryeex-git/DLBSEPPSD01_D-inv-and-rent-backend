import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ItemsModule } from './items/items.module';
import { CategoriesModule } from './categories/categories.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LoansModule } from './loans/loans.module';
import { AuditService } from './common/audit.service';
import { PrismaModule } from './common/prisma.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ItemsModule,
    PrismaModule,
    CommonModule,
    CategoriesModule,
    ReservationsModule,
    LoansModule,
    AdminModule,
  ],
  providers: [AuditService],
})
export class AppModule {}
