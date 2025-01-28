import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type SubcategoryDocument = Subcategory & Document;

@Schema()
export class Subcategory {

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, default: Date.now })
    createdAt: Date;

    @Prop()
    updatedAt: Date;

}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);