import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';
import { ProductItem } from 'src/modules/orders/dto/create-order.dto';

export type OrdersVisitorDocument = OrdersVisitor & Document;

@Schema()
export class OrdersVisitor {
  @Prop({ isRequired: true })
  @IsString()
  buyerId: string;

  @Prop({ isRequired: false })
  buyerName?: string;

  @Prop({ isRequired: false })
  churchCore?: string;

  @Prop({ isRequired: false })
  buyerTelephone?: string;

  @Prop({ isRequired: true })
  @IsArray()
  products: ProductItem[];

  @Prop({ isRequired: true })
  @IsNumber()
  totalPrice: number;

  @Prop({ isRequired: true })
  createdAt: Date;

  @Prop({ isRequired: false })
  invoiceId?: string; // fatura a que pertence
}

export const OrdersVisitorSchema = SchemaFactory.createForClass(OrdersVisitor);
