import { PartialType } from '@nestjs/mapped-types';

export class ProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
}

export class CreateProductDto extends ProductDto {
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
