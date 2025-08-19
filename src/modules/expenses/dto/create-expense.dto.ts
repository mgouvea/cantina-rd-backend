import { PartialType } from '@nestjs/mapped-types';
import { ExpenseTypeEnum } from './expenseEnum';

export class CreateExpenseDto {
  userId: string;
  groupFamilyId: string;
  description: string;
  expenseDate: Date | null;
  referenceMonth: Date | null;
  expenseValue: number;
  expenseType: ExpenseTypeEnum;
  urlImage: string;
  publicIdImage: string;
  createdAt: Date;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
