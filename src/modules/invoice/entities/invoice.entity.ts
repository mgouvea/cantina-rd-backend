import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export class Invoice {
  @Prop({ isRequired: true, type: [String] })
  @IsArray()
  buyerIds: string[];

  @Prop({ isRequired: true })
  @IsString()
  groupFamilyId: string;

  @Prop({ isRequired: true })
  @IsDate()
  startDate: Date;

  @Prop({ isRequired: true })
  @IsDate()
  endDate: Date;

  @Prop({ isRequired: true })
  @IsNumber()
  totalAmount: number;

  @Prop({ isRequired: true, default: 'OPEN' })
  @IsEnum(['OPEN', 'PARTIALLY_PAID', 'PAID'])
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID';

  @Prop({ default: () => new Date() })
  @IsDate()
  createdAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
