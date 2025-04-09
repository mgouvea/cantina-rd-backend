import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
  name: string;
  imageBase64: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
