import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DebitService } from './debit.service';
import { CreateDebitDto, UpdateDebitDto } from './dto/create-debit.dto';

@Controller('debit')
export class DebitController {
  constructor(private readonly debitService: DebitService) {}

  @Post()
  create(@Body() createDebitDto: CreateDebitDto) {
    return this.debitService.create(createDebitDto);
  }

  @Get()
  findAll() {
    return this.debitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debitService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDebitDto: UpdateDebitDto) {
    return this.debitService.update(id, updateDebitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.debitService.remove(id);
  }
}
