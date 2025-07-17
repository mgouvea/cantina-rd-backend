import { Module } from '@nestjs/common';
import { VisitorsInvoiceService } from './visitors-invoice.service';
import { VisitorsInvoiceController } from './visitors-invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VisitorsInvoice,
  InvoiceSchema,
} from './entities/visitors-invoice.entity';
import { OrdersVisitorsModule } from '../orders-visitors/orders-visitors.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { VisitorsPaymentModule } from '../visitors-payment/visitors-payment.module';
import {
  OrdersVisitor,
  OrdersVisitorSchema,
} from '../orders-visitors/entities/orders-visitor.entity';
import {
  VisitorsPayment,
  VisitorsPaymentSchema,
} from '../visitors-payment/entities/visitors-payment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorsInvoice.name, schema: InvoiceSchema },
      { name: OrdersVisitor.name, schema: OrdersVisitorSchema },
      { name: VisitorsPayment.name, schema: VisitorsPaymentSchema },
    ]),
    OrdersVisitorsModule,
    VisitorsModule,
    VisitorsPaymentModule,
  ],
  controllers: [VisitorsInvoiceController],
  providers: [VisitorsInvoiceService],
  exports: [VisitorsInvoiceService],
})
export class VisitorsInvoiceModule {}
