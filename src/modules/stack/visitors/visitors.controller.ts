// visitors.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto, UpdateVisitorDto } from './dto/create-visitor.dto';

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  create(@Body() createVisitorDto: CreateVisitorDto) {
    return this.visitorsService.create(createVisitorDto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.visitorsService.findAll(search);
  }

  @Get('without-date-filter')
  findAllWithoutDateFilter() {
    return this.visitorsService.findAllWithoutDateFilter();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisitorDto: UpdateVisitorDto) {
    return this.visitorsService.update(id, updateVisitorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorsService.remove(id);
  }

  @Delete('cleanup')
  @HttpCode(200)
  cleanup() {
    return this.visitorsService.cleanup();
  }
}
