import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { InvoicesService } from './invoice.service';
import {
  CreateInvoiceDto,
  FetchMultipleInvoicesDto,
} from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Post('full')
  getMultipleFullInvoices(@Body() body: FetchMultipleInvoicesDto) {
    return this.invoicesService.getFullInvoices(body.ids);
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

  @Post(':id/send-whatsapp')
  sendInvoiceByWhatsapp(@Param('id') invoiceId: string) {
    return this.invoicesService.sendInvoiceByWhatsapp(invoiceId);
  }

  @Delete(':id')
  deleteInvoice(@Param('id') invoiceId: string) {
    return this.invoicesService.deleteInvoice(invoiceId);
  }
}
