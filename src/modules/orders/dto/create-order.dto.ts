import { PartialType } from '@nestjs/mapped-types';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export class CreateOrderDto {
  buyerId: string;
  groupFamilyId: string;
  products: ProductItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt?: Date;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
