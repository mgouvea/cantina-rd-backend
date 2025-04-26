import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Category } from 'src/modules/categories/entities/category.entity';

export type SubcategoryDocument = Subcategory & Document;

@Schema()
export class Subcategory {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);
