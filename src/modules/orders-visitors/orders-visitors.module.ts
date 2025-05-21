import { Module } from '@nestjs/common';
import { OrdersVisitorsService } from './orders-visitors.service';
import { OrdersVisitorsController } from './orders-visitors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OrdersVisitor,
  OrdersVisitorSchema,
} from './entities/orders-visitor.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { VisitorsModule } from '../visitors/visitors.module';

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
})
export class OrdersVisitorsModule {}
