import { PartialType } from '@nestjs/mapped-types';

interface members {
  userId: string;
}

export class CreateGroupFamilyDto {
  name: string;
  members: members[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateGroupFamilyDto extends PartialType(CreateGroupFamilyDto) {}
