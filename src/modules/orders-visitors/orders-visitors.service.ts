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
import { DashDate } from 'src/shared/types/dashDate.type';

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

  async findTotalOrders(dateRange: DashDate) {
    // Validar se as datas são válidas
    if (
      !dateRange ||
      !dateRange.startDate ||
      !dateRange.endDate ||
      isNaN(dateRange.startDate.getTime()) ||
      isNaN(dateRange.endDate.getTime())
    ) {
      return 0; // Retorna 0 se as datas forem inválidas
    }

    const orders = await this.ordersVisitorModel
      .find({
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .exec();

    return orders.reduce((total, order) => total + order.totalPrice, 0);
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
