import { PartialType } from '@nestjs/mapped-types';

export class ProductDto {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  imageBase64: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateProductDto extends PartialType(ProductDto) {}
