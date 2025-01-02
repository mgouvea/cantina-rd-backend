import { PartialType } from '@nestjs/mapped-types';
import { ProductDto } from 'src/modules/products/dto/product.dto';

export class CreateOrderDto {
  buyerName: string;
  groupFamily: string;
  products: ProductDto[];
  finalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
