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

  @Patch('add-member/:id')
  async addMember(
    @Param('id') groupFamilyId: string,
    @Body() body: { membersIds: string[] },
  ) {
    const updatedGroupFamily =
      await this.groupFamilyService.addMembersToGroupFamily(
        groupFamilyId,
        body.membersIds,
      );

    if (!updatedGroupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }

    return updatedGroupFamily;
  }

  @Patch('remove-member/:id')
  async removeMember(
    @Param('id') groupFamilyId: string,
    @Body() body: { membersIds: string[] },
  ) {
    const updatedGroupFamily =
      await this.groupFamilyService.removeMembersFromGroupFamily(
        groupFamilyId,
        body.membersIds,
      );

    if (!updatedGroupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }

    return updatedGroupFamily;
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
