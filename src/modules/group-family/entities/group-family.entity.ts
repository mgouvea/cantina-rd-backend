import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsString } from 'class-validator';
import { Document } from 'mongoose';

export type GroupFamilyDocument = GroupFamily & Document;

export interface GroupFamilyMember {
  userId: string;
  memberName: string;
  memberAvatar: string;
}

@Schema()
export class GroupFamily {
  @Prop({ required: true })
  @IsString()
  name: string;

  @Prop({ required: true })
  @IsString()
  owner: string;

  @Prop({ isRequired: false, type: Array })
  @IsArray()
  members: GroupFamilyMember[];

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GroupFamilySchema = SchemaFactory.createForClass(GroupFamily);
