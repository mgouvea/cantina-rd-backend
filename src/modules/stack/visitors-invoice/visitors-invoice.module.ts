import { Module } from '@nestjs/common';
import { VisitorsInvoiceService } from './visitors-invoice.service';
import { VisitorsInvoiceController } from './visitors-invoice.controller';

@Module({
  controllers: [VisitorsInvoiceController],
  providers: [VisitorsInvoiceService]
})
export class VisitorsInvoiceModule {}
