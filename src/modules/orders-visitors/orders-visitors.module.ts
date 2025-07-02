import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersVisitorsController } from './orders-visitors.controller';
import { OrdersVisitorsService } from './orders-visitors.service';
import { VisitorsModule } from '../visitors/visitors.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import {
  OrdersVisitor,
  OrdersVisitorSchema,
} from './entities/orders-visitor.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrdersVisitor.name, schema: OrdersVisitorSchema },
    ]),
    WhatsAppModule,
    VisitorsModule,
  ],
  controllers: [OrdersVisitorsController],
  providers: [OrdersVisitorsService],
  exports: [OrdersVisitorsService],
})
export class OrdersVisitorsModule {}
