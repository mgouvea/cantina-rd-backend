import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  ValidationPipe,
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

  @Patch(':id')
  async addMembers(
    @Param('id') id: string,
    @Body(ValidationPipe) updateGroupFamilyDto: UpdateGroupFamilyDto,
  ) {
    const { addMembers } = updateGroupFamilyDto;

    const groupFamily = await this.groupFamilyService.findOne(id);
    if (!groupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }

    groupFamily.members = groupFamily.members.concat(addMembers || []);
    await groupFamily.save();

    return groupFamily;
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const groupFamily = await this.groupFamilyService.remove(id);
    if (!groupFamily) {
      throw new HttpException('Group family not found', HttpStatus.NOT_FOUND);
    }
    return groupFamily;
  }
}
