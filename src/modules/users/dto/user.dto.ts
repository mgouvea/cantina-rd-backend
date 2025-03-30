import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  name: string;
  isAdmin: boolean;
  telephone: string;
  groupFamily: string;
  imageBase64: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
