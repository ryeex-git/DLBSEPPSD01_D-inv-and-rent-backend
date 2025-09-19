import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { AdminPinGuard } from 'src/common/admin-pin.guard';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, AdminPinGuard],
  exports: [ItemsService],
})
export class ItemsModule {}
