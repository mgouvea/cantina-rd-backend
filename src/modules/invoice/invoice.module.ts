import { CreditModule } from '../credit/credit.module';
import { DebitModule } from '../debit/debit.module';
import { EvolutionWhatsappModule } from '../evolution-whatsapp/evolution-whatsapp.module';
import { forwardRef, Module } from '@nestjs/common';
import { GroupFamilyModule } from '../group-family/group-family.module';
import { Invoice, InvoiceSchema } from './entities/invoice.entity';
import { InvoicesController } from './invoice.controller';
import { InvoicesService } from './invoice.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { Payment, PaymentSchema } from '../payments/entities/payment.entity';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import {
  GroupFamily,
  GroupFamilySchema,
} from '../group-family/entities/group-family.entity';

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
    EvolutionWhatsappModule,
    UsersModule,
    CreditModule,
    DebitModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [
    InvoicesService,
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
  ],
})
export class InvoiceModule {}
