import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';
import { ProductItem } from '../dto/create-order.dto';

export type OrderDocument = Order & Document;

@Schema()
export class Order {
  @Prop({ isRequired: true })
  @IsString()
  buyerId: string;

  @Prop({ isRequired: true })
  @IsString()
  groupFamilyId: string;

  @Prop({ isRequired: true })
  @IsArray()
  products: ProductItem[];

  @Prop({ isRequired: true })
  @IsNumber()
  totalPrice: number;

  @Prop({ isRequired: true })
  createdAt: Date;

  @Prop({ isRequired: false })
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
