import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ExpenseDocument = Expense & Document;

@Schema()
export class Expense {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  groupFamilyId: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  expenseDate: Date;

  @Prop({ required: true })
  referenceMonth: string;

  @Prop({ required: true })
  expenseValue: number;

  @Prop({ required: true })
  expenseType: 'canteenCard' | 'canteenCredit' | 'paidByTreasurer' | 'refund';

  @Prop({ required: false })
  urlImage: string;

  @Prop({ required: false })
  publicIdImage: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
