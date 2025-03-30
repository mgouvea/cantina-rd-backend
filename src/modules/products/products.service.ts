import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Product, ProductDocument } from './entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
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
