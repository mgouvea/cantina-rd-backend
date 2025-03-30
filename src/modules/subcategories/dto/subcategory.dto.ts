import { PartialType } from '@nestjs/mapped-types';

export class SubcategoryDto {
  name: string;
  categoryId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class UpdateSubcategoryDto extends PartialType(SubcategoryDto) {}
