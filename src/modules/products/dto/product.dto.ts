import { PartialType } from '@nestjs/mapped-types';

export class CreateProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
