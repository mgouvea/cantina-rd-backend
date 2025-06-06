import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditDto, UpdateCreditDto } from './dto/create-credit.dto';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post()
  create(@Body() createCreditDto: CreateCreditDto) {
    return this.creditService.create(createCreditDto);
  }

  @Get()
  findAll() {
    return this.creditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditService.findOne(id);
  }

  @Get('group-family/:id')
  findByGroupFamily(@Param('id') groupFamilyId: string) {
    return this.creditService.findByGroupFamilyId(groupFamilyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditDto: UpdateCreditDto) {
    return this.creditService.update(id, updateCreditDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditService.remove(id);
  }
}
