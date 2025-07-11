import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UsersModule } from '../users/users.module';
import { GroupFamilyModule } from '../group-family/group-family.module';
import { ProductsModule } from '../products/products.module';
import { EvolutionWhatsappModule } from '../evolution-whatsapp/evolution-whatsapp.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    UsersModule,
    GroupFamilyModule,
    ProductsModule,
    EvolutionWhatsappModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [
    OrdersService,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
})
export class OrdersModule {}
