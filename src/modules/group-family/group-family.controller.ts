import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupFamilyService } from './group-family.service';
import {
  CreateGroupFamilyDto,
  UpdateGroupFamilyDto,
} from './dto/group-family.dto';
import { MemberDto } from './dto/add-member.dto';

@Controller('group-family')
export class GroupFamilyController {
  constructor(private readonly groupFamilyService: GroupFamilyService) {}

  @Post()
  async create(@Body() createGroupFamilyDto: CreateGroupFamilyDto) {
    try {
      return await this.groupFamilyService.create(createGroupFamilyDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll() {
    return this.groupFamilyService.findAll();
  }

  @Get('name/:id')
  async findOne(@Param('id') id: string) {
    const groupFamily = await this.groupFamilyService.findOne(id);
    if (!groupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }
    return groupFamily.name;
  }

  @Get('owner')
  async findAllWithOwnerName() {
    try {
      return await this.groupFamilyService.findAllWithOwnerName();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('add-or-remove-member/:id')
  async updateMembers(
    @Param('id') id: string,
    @Body() addMemberDto: MemberDto[],
  ) {
    const updatedGroupFamily =
      await this.groupFamilyService.addOrRemoveMembersToGroupFamily(
        id,
        addMemberDto,
      );

    if (!updatedGroupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }

    return updatedGroupFamily;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupFamilyDto: UpdateGroupFamilyDto,
  ) {
    const groupFamily = await this.groupFamilyService.update(
      id,
      updateGroupFamilyDto,
    );
    if (!groupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }
    return groupFamily;
  }

  @Patch('remove-member')
  async removeMember(@Body() body: { id: string | string[] }): Promise<{
    message: string;
    updatedGroupFamilies: any[];
  }> {
    const memberIds = Array.isArray(body.id) ? body.id : [body.id];

    const updatedGroupFamilies =
      await this.groupFamilyService.removeMembersFromGroupFamily(memberIds);

    if (updatedGroupFamilies.length === 0) {
      throw new HttpException(
        'Member(s) not found in any group family',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      message: `Member(s) removed successfully from ${updatedGroupFamilies.length} group families`,
      updatedGroupFamilies,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const groupFamily = await this.groupFamilyService.remove(id);
    if (!groupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }
    return groupFamily;
  }
}
