import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { GroupFamilyModule } from '../group-family/group-family.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { OrdersVisitorsModule } from '../orders-visitors/orders-visitors.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    OrdersModule,
    OrdersVisitorsModule,
    InvoiceModule,
    PaymentsModule,
    GroupFamilyModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
