import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './entities/category.entity';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import {
  Subcategory,
  SubcategorySchema,
} from '../subcategories/entities/subcategory.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Subcategory.name, schema: SubcategorySchema },
    ]),
    SubcategoriesModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, SubcategoriesService],
})
export class CategoriesModule {}
