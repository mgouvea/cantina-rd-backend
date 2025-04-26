import { Invoice, InvoiceSchema } from './entities/invoice.entity';
import { InvoicesController } from './invoice.controller';
import { InvoicesService } from './invoice.service';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    OrdersModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [
    InvoicesService,
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
  ],
})
export class InvoiceModule {}
