import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { InvoiceModule } from '../invoice/invoice.module';
import { GroupFamilyModule } from '../group-family/group-family.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    forwardRef(() => InvoiceModule),
    forwardRef(() => GroupFamilyModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [
    PaymentsService,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
})
export class PaymentsModule {}
