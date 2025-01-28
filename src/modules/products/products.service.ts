import { Injectable } from '@nestjs/common';
import { Product, ProductDocument } from './entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';
import {  ProductDto, UpdateProductDto } from './dto/product.dto';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  create(createProductDto: ProductDto) {
    return this.productModel.create(createProductDto);
  }

  async findAll() {
    return this.productModel
      .find()
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();
  }

  async findOne(id: string) {
    return this.productModel
      .findById(id)
      .populate('categoryId')
      .populate('subcategoryId')
      .exec();
  }

  // Atualizar um produto
  update(id: string, updateProductDto: UpdateProductDto) {
    return this.productModel.findByIdAndUpdate(id, updateProductDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }
}
