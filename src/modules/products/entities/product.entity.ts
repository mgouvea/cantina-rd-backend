import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Subcategory } from 'src/modules/subcategories/entities/subcategory.entity';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  tag: string;

  @Prop({ required: true })
  price: number;

  // Usamos Types.ObjectId para referenciar o ID da Categoria
  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId; // Isso será o ID da categoria referenciada

  @Prop({ type: Types.ObjectId, ref: Subcategory.name, required: true })
  subcategoryId: Types.ObjectId; // Isso será o ID da subcategoria referenciada

  @Prop({ required: true })
  urlImage: string;

  @Prop({ required: true, unique: true })
  publicIdImage: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false, default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
