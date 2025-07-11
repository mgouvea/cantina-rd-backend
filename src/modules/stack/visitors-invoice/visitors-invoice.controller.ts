import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VisitorsInvoiceService } from './visitors-invoice.service';
import { CreateVisitorsInvoiceDto } from './dto/create-visitors-invoice.dto';
import { UpdateVisitorsInvoiceDto } from './dto/update-visitors-invoice.dto';

@Controller('visitors-invoice')
export class VisitorsInvoiceController {
  constructor(private readonly visitorsInvoiceService: VisitorsInvoiceService) {}

  @Post()
  create(@Body() createVisitorsInvoiceDto: CreateVisitorsInvoiceDto) {
    return this.visitorsInvoiceService.create(createVisitorsInvoiceDto);
  }

  @Get()
  findAll() {
    return this.visitorsInvoiceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorsInvoiceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisitorsInvoiceDto: UpdateVisitorsInvoiceDto) {
    return this.visitorsInvoiceService.update(+id, updateVisitorsInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorsInvoiceService.remove(+id);
  }
}
