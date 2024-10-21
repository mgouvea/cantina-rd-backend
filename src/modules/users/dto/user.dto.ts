import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  telephone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
