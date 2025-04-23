import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/orders')
  getOrdersByInvoice(@Param('id') invoiceId: string) {
    return this.invoicesService.getOrdersByInvoice(invoiceId);
  }

  @Get('/user/:buyerId/statement')
  getUserStatement(@Param('buyerId') buyerId: string) {
    return this.invoicesService.getUserStatement(buyerId);
  }
}
