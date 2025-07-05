import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  isAdmin: boolean;

  @Prop({ required: false })
  telephone: string;

  @Prop({ required: false })
  groupFamily: string;

  @Prop({ required: true })
  urlImage: string;

  @Prop({ required: true })
  publicIdImage: string;

  @Prop({ required: false })
  isChild: boolean;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
