import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString, IsDate, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { Document } from 'mongoose';

export type VisitorsInvoiceDocument = VisitorsInvoice & Document;

@Schema()
export class VisitorsInvoice {
  @Prop({ isRequired: true })
  @IsString()
  buyerId: string;

  @Prop({ isRequired: true })
  @IsDate()
  startDate: Date;

  @Prop({ isRequired: true })
  @IsDate()
  endDate: Date;

  @Prop({ isRequired: true })
  @IsNumber()
  totalAmount: number;

  @Prop({ default: null })
  @IsNumber()
  originalAmount: number;

  @Prop({ isRequired: true, default: 0 })
  @IsNumber()
  paidAmount: number;

  @Prop({ isRequired: true, default: false })
  @IsBoolean()
  sentByWhatsapp: boolean;

  @Prop({ isRequired: true, default: 'OPEN' })
  @IsEnum(['OPEN', 'PARTIALLY_PAID', 'PAID'])
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID';

  @Prop({ default: false })
  @IsBoolean()
  isArchivedInvoice: boolean;

  @Prop({ default: () => new Date() })
  @IsDate()
  createdAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(VisitorsInvoice);
