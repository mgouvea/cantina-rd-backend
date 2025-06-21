import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GroupFamily } from 'src/modules/group-family/entities/group-family.entity';

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  isAdmin: boolean;

  @Prop({ required: false })
  telephone: string;

  @Prop({ type: Types.ObjectId, ref: GroupFamily.name, required: true })
  groupFamily: Types.ObjectId;

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
