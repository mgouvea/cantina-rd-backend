import { PartialType } from '@nestjs/mapped-types';

export class CreateGroupFamilyDto {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateGroupFamilyDto extends PartialType(CreateGroupFamilyDto) {}
