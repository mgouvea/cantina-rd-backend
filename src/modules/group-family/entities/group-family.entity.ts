import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroupFamilyDocument = GroupFamily & Document;

@Schema()
export class GroupFamily {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GroupFamilySchema = SchemaFactory.createForClass(GroupFamily);
