import { Invoice, InvoiceSchema } from './entities/invoice.entity';
import { InvoicesController } from './invoice.controller';
import { InvoicesService } from './invoice.service';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { GroupFamilyModule } from '../group-family/group-family.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { UsersModule } from '../users/users.module';
import { CreditModule } from '../credit/credit.module';
import {
  GroupFamily,
  GroupFamilySchema,
} from '../group-family/entities/group-family.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { Payment, PaymentSchema } from '../payments/entities/payment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: GroupFamily.name, schema: GroupFamilySchema },
    ]),
    OrdersModule,
    forwardRef(() => PaymentsModule),
    GroupFamilyModule,
    WhatsAppModule,
    UsersModule,
    CreditModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [
    InvoicesService,
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
  ],
})
export class InvoiceModule {}
