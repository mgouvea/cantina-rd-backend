import { Category, CategoryDocument } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import {
  Subcategory,
  SubcategoryDocument,
} from '../subcategories/entities/subcategory.entity';
import { BucketService } from 'src/shared/bucket/bucket.service';
import { sanitizedName } from 'src/shared/utils/helpers';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Subcategory.name)
    private subcategoryModel: Model<SubcategoryDocument>,
    private readonly subcategoriesService: SubcategoriesService,
    private readonly bucketService: BucketService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const publicId = `categories/${sanitizedName(createCategoryDto.name)}`;

    const existingCategory = await this.categoryModel.findOne({
      publicIdImage: publicId,
    });

    if (existingCategory) {
      throw new ConflictException(
        'Já existe uma categoria com esse nome (imagem).',
      );
    }

    const imageUrl = await this.bucketService.uploadBase64Image(
      createCategoryDto.urlImage,
      'categories',
      sanitizedName(createCategoryDto.name),
    );
    const category = new this.categoryModel({
      ...createCategoryDto,
      createdAt: Date.now(),
      urlImage: imageUrl,
      publicIdImage: publicId,
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
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const subcategories = await this.subcategoryModel.find({ categoryId: id });
    for (const subcategory of subcategories) {
      await this.subcategoriesService.remove(subcategory._id.toString());
    }

    await this.bucketService.deleteImageByName(category.publicIdImage);
    return this.categoryModel.findByIdAndDelete(id);
  }
}
