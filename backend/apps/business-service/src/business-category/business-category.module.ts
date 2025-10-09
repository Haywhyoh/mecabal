import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessCategory } from '@app/database/entities/business-category.entity';
import { BusinessCategoryService } from './business-category.service';
import { BusinessCategoryController } from './business-category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessCategory])],
  controllers: [BusinessCategoryController],
  providers: [BusinessCategoryService],
  exports: [BusinessCategoryService],
})
export class BusinessCategoryModule {}
