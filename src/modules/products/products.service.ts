import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    const imageUrl = await this.bucketService.uploadBase64Image(
      createProductDto.urlImage,
      'products',
      sanitizedName(createProductDto.name),
    );
    const product = new this.productModel({
      ...createProductDto,
      createdAt: Date.now(),
      urlImage: imageUrl,
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
    const product = await this.productModel
      .find({ categoryId: categoryId })
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  // Atualizar um produto
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

  remove(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }
}
