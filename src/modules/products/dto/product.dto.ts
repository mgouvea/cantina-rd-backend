import { PartialType } from '@nestjs/mapped-types';

export class ProductDto {
  name: string;
  description: string;
  tag: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  urlImage: string;
  publicIdImage: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UpdateProductDto extends PartialType(ProductDto) {}
