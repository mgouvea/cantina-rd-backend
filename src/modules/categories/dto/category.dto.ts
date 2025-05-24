import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
  name: string;
  urlImage: string;
  publicIdImage: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
