import { PartialType } from '@nestjs/mapped-types';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  name: string;

  @IsString()
  telephone: string;

  @IsString()
  churchCore?: string; // núcleo

  @IsOptional()
  @IsDate()
  lastVisit?: Date;

  @IsOptional()
  @IsNumber()
  visitCount?: number;
}

export class UpdateVisitorDto extends PartialType(CreateVisitorDto) {}
