import { PartialType } from '@nestjs/mapped-types';
import { ProductItem } from 'src/modules/orders/dto/create-order.dto';

export class CreateOrdersVisitorDto {
  buyerId: string;
  products: ProductItem[];
  totalPrice: number;
  createdAt: Date;
  invoiceId?: string;
}

export class UpdateOrdersVisitorDto extends PartialType(
  CreateOrdersVisitorDto,
) {}
