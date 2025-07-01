import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type DebitDocument = Debit & Document;

@Schema()
export class Debit {
  @Prop({ required: true })
  groupFamilyId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: false })
  includedInInvoice: boolean;

  @Prop({ default: undefined })
  invoiceId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const DebitSchema = SchemaFactory.createForClass(Debit);
