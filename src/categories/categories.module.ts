import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controler';
import { AdminPinGuard } from 'src/common/admin-pin.guard';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, AdminPinGuard],
})
export class CategoriesModule {}
