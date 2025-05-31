import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema()
export class Payment {
  @Prop({ isRequired: true })
  @IsString()
  invoiceId: string;

  @Prop({ isRequired: true })
  @IsNumber()
  amountPaid: number;

  @Prop({ isRequired: true })
  @IsDate()
  paymentDate: Date;

  @Prop({ isRequired: true })
  @IsBoolean()
  isPartial: boolean;

  @Prop({ default: false })
  isCredit: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
