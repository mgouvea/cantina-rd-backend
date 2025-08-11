import { PartialType } from '@nestjs/mapped-types';

export class CreateExpenseDto {
  userId: string;
  groupFamilyId: string;
  description: string;
  expenseDate: Date | null;
  referenceMonth: Date | null;
  expenseValue: number;
  expenseType: 'canteenCard' | 'canteenCredit' | 'paidByTreasurer' | 'refund';
  urlImage: string;
  publicIdImage: string;
  createdAt: Date;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
