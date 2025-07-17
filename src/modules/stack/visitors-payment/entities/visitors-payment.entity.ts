import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

export type VisitorsPaymentDocument = VisitorsPayment & Document;

@Schema()
export class VisitorsPayment {
  @Prop({ isRequired: true })
  @IsString()
  invoiceId: string;

  @Prop({ isRequired: true })
  @IsNumber()
  amountPaid: number;

  @Prop({ default: false })
  @IsBoolean()
  isPartial: boolean;

  @Prop({ default: () => new Date() })
  @IsDate()
  paymentDate: Date;

  @Prop({ default: () => new Date() })
  @IsDate()
  createdAt: Date;
}

export const VisitorsPaymentSchema =
  SchemaFactory.createForClass(VisitorsPayment);
