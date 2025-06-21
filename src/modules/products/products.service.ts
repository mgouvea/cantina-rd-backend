import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product, ProductDocument } from './entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
import { Model } from 'mongoose';
import { sanitizedName } from 'src/shared/utils/helpers';
import { BucketService } from 'src/shared/bucket/bucket.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly bucketService: BucketService,
  ) {}

  async create(createProductDto: ProductDto) {
    const publicId = `products/${sanitizedName(createProductDto.name)}`;

    const existingProduct = await this.productModel.findOne({
      publicIdImage: publicId,
    });

    if (existingProduct) {
      throw new ConflictException(
        'Já existe um produto com esse nome (imagem).',
      );
    }

    const imageUrl = await this.bucketService.uploadBase64Image(
      createProductDto.urlImage,
      'products',
      sanitizedName(createProductDto.name),
    );
    const product = new this.productModel({
      ...createProductDto,
      urlImage: imageUrl,
      publicIdImage: publicId,
      isActive: true,
    });
    return product.save();
  }

  async findAll() {
    return await this.productModel
      .find()
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  async findByCategory(categoryId: string) {
    const products = await this.productModel
      .find({ categoryId: categoryId, isActive: true })
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();

    return products;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,
      })
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();

    if (!updatedProduct) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return updatedProduct;
  }

  async remove(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.bucketService.deleteImageByName(product.publicIdImage);
    return this.productModel.findByIdAndDelete(id);
  }
}
