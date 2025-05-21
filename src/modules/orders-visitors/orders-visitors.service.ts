import { Injectable } from '@nestjs/common';
import {
  CreateOrdersVisitorDto,
  UpdateOrdersVisitorDto,
} from './dto/create-orders-visitor.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OrdersVisitor,
  OrdersVisitorDocument,
} from './entities/orders-visitor.entity';
import { WhatsappService } from 'src/modules/whatsapp/whatsapp.service';
import { VisitorsService } from '../visitors/visitors.service';

@Injectable()
export class OrdersVisitorsService {
  constructor(
    @InjectModel(OrdersVisitor.name)
    private ordersVisitorModel: Model<OrdersVisitorDocument>,
    private visitorsService: VisitorsService,
    private whatsappService: WhatsappService,
  ) {}

  async create(createOrdersVisitorDto: CreateOrdersVisitorDto) {
    const createdAt = new Date();

    // 1. Cria o pedido
    const order = await this.ordersVisitorModel.create({
      ...createOrdersVisitorDto,
      createdAt,
    });

    // 2. Busca nome e telefone do comprador
    const visitor = await this.visitorsService.findVisitorNameAndPhoneById(
      createOrdersVisitorDto.buyerId,
    );
    const buyerName = visitor.name;
    const buyerPhone = visitor.telephone;
    const orderTime = createdAt;

    // 3. Envia a mensagem se tiver número
    if (buyerPhone) {
      await this.whatsappService.sendPurchaseConfirmation(
        buyerName,
        buyerPhone,
        orderTime,
        createOrdersVisitorDto.products,
      );
    }

    return order;
  }

  async findAll() {
    const ordersVisitors = await this.ordersVisitorModel.find().exec();
    await Promise.all(
      ordersVisitors.map(async (order) => {
        const userName = await this.visitorsService.findVisitorNameAndPhoneById(
          order.buyerId,
        );
        order.buyerName = userName.name;
        order.churchCore = userName.churchCore;
      }),
    );
    return ordersVisitors;
  }

  findOne(id: number) {
    return this.ordersVisitorModel.findById(id).exec();
  }

  update(id: number, updateOrdersVisitorDto: UpdateOrdersVisitorDto) {
    return this.ordersVisitorModel
      .findByIdAndUpdate(id, updateOrdersVisitorDto)
      .exec();
  }

  remove(id: number) {
    return this.ordersVisitorModel.findByIdAndDelete(id).exec();
  }
}
