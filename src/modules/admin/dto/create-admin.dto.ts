import { PartialType } from '@nestjs/mapped-types';

export class CreateAdminDto {
  idUser: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
