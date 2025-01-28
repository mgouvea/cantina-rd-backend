import { PartialType } from '@nestjs/mapped-types';

export class ProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}


export class UpdateProductDto extends PartialType(ProductDto) {}
