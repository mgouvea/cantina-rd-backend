import { PartialType } from '@nestjs/mapped-types';

export class CreateCreditDto {
  creditedAmount: number;
  amount: number;
  groupFamilyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateCreditDto extends PartialType(CreateCreditDto) {}
