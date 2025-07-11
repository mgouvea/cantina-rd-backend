import { Module } from '@nestjs/common';
import { VisitorsPaymentService } from './visitors-payment.service';
import { VisitorsPaymentController } from './visitors-payment.controller';

@Module({
  controllers: [VisitorsPaymentController],
  providers: [VisitorsPaymentService]
})
export class VisitorsPaymentModule {}
