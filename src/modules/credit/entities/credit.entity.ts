import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CreditDocument = Credit & Document;

@Schema()
export class Credit {
  @Prop({ required: true })
  creditedAmount: number;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  groupFamilyId: string;

  @Prop({ required: false, default: false })
  archivedCredit: boolean;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  updatedAt?: Date;
}

export const CreditSchema = SchemaFactory.createForClass(Credit);
