import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VisitorsInvoiceService } from './visitors-invoice.service';
import {
  CreateVisitorsInvoiceDto,
  UpdateVisitorsInvoiceDto,
} from './dto/create-visitors-invoice.dto';
import { FetchMultipleVisitorsInvoicesDto } from './dto/fetch-multiple-invoices.dto';

@Controller('visitors-invoice')
export class VisitorsInvoiceController {
  constructor(
    private readonly visitorsInvoiceService: VisitorsInvoiceService,
  ) {}

  @Post()
  create(@Body() createVisitorsInvoiceDto: CreateVisitorsInvoiceDto) {
    return this.visitorsInvoiceService.create(createVisitorsInvoiceDto);
  }

  @Post('full')
  getMultipleFullInvoices(@Body() body: FetchMultipleVisitorsInvoicesDto) {
    return this.visitorsInvoiceService.getFullInvoices(
      body.ids,
      body.isArchivedInvoice,
    );
  }

  @Get()
  findAll() {
    return this.visitorsInvoiceService.findAll();
  }

  @Patch('reset-whatsapp')
  resetWhatsappStatus() {
    return this.visitorsInvoiceService.updateVisitorsInvoice();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorsInvoiceService.findOne(id);
  }

  @Post(':id/send-whatsapp')
  sendInvoiceByWhatsapp(@Param('id') buyerId: string) {
    return this.visitorsInvoiceService.sendInvoiceByWhatsapp(buyerId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVisitorsInvoiceDto: UpdateVisitorsInvoiceDto,
  ) {
    return this.visitorsInvoiceService.update(id, updateVisitorsInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorsInvoiceService.remove(id);
  }
}
