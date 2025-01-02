import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';
import { ProductDto } from 'src/modules/products/dto/product.dto';

export type OrderDocument = Order & Document;

@Schema()
export class Order {
  @Prop({ isRequired: true })
  @IsString()
  buyerName: string;

  @Prop({ isRequired: true })
  @IsString()
  groupFamily: string;

  @Prop({ isRequired: true })
  @IsArray()
  products: ProductDto[];

  @Prop({ isRequired: true })
  @IsNumber()
  finalPrice: number;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
