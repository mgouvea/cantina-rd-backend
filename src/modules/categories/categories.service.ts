import { Category, CategoryDocument } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import {
  Subcategory,
  SubcategoryDocument,
} from '../subcategories/entities/subcategory.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Subcategory.name)
    private subcategoryModel: Model<SubcategoryDocument>,
    private readonly subcategoriesService: SubcategoriesService,
  ) {}

  create(createCategoryDto: CreateCategoryDto) {
    const category = new this.categoryModel({
      ...createCategoryDto,
      createdAt: Date.now(),
    });
    return category.save();
  }

  findAll() {
    return this.categoryModel.find();
  }

  findOne(id: string) {
    return this.categoryModel.findById(id);
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryModel.findByIdAndUpdate(id, updateCategoryDto);
  }

  async remove(id: string) {
    const subcategories = await this.subcategoryModel.find({ categoryId: id });

    for (const subcategory of subcategories) {
      await this.subcategoriesService.remove(subcategory._id.toString());
    }

    return this.categoryModel.findByIdAndDelete(id);
  }
}
