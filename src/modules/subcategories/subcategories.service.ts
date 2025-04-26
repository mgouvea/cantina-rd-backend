import { Injectable } from '@nestjs/common';
import { SubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';
import {
  Subcategory,
  SubcategoryDocument,
} from './entities/subcategory.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectModel(Subcategory.name)
    private subcategoryModel: Model<SubcategoryDocument>,
  ) {}

  create(createSubcategoryDto: SubcategoryDto) {
    const subcategory = new this.subcategoryModel({
      ...createSubcategoryDto,
      createdAt: Date.now(),
    });
    return subcategory.save();
  }

  findAll() {
    return this.subcategoryModel.find();
  }

  findOne(id: string) {
    return this.subcategoryModel.findById(id);
  }

  update(id: string, updateSubcategoryDto: UpdateSubcategoryDto) {
    return this.subcategoryModel.findByIdAndUpdate(id, updateSubcategoryDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.subcategoryModel.findByIdAndDelete(id);
  }
}
