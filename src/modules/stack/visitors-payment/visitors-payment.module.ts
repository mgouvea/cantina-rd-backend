import { Module } from '@nestjs/common';
import { VisitorsPaymentService } from './visitors-payment.service';
import { VisitorsPaymentController } from './visitors-payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VisitorsPayment,
  VisitorsPaymentSchema,
} from './entities/visitors-payment.entity';
import {
  VisitorsInvoice,
  InvoiceSchema,
} from '../visitors-invoice/entities/visitors-invoice.entity';
import { VisitorsModule } from '../visitors/visitors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorsPayment.name, schema: VisitorsPaymentSchema },
      { name: VisitorsInvoice.name, schema: InvoiceSchema },
    ]),
    VisitorsModule,
  ],
  controllers: [VisitorsPaymentController],
  providers: [VisitorsPaymentService],
  exports: [VisitorsPaymentService],
})
export class VisitorsPaymentModule {}
