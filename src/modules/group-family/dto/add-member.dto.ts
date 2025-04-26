import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MemberDto {
  userId: string;
}

export class AddMemberDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[];
}
