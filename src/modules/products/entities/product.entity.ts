import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/modules/categories/entities/category.entity';
export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  // Usamos Types.ObjectId para referenciar o ID da Categoria
  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId; // Isso será o ID da categoria referenciada

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  subcategoryId: Types.ObjectId; // Isso será o ID da categoria referenciada

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
