import { Injectable } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { Model } from 'mongoose';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    private readonly whatsappService: WhatsAppService,
    private readonly userService: UsersService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const createdAt = new Date();

    // 1. Cria o pedido
    const order = await this.orderModel.create({
      ...createOrderDto,
      createdAt,
    });

    // 2. Busca nome e telefone do comprador — você pode ajustar para buscar no banco
    const user = await this.userService.findUserNameAndPhoneById(
      createOrderDto.buyerId,
    );
    const buyerName = user.name;
    const buyerPhone = user.telephone;

    // 3. Envia a mensagem se tiver número
    if (buyerPhone) {
      await this.whatsappService.sendPurchaseNotification(
        buyerPhone,
        buyerName,
        createOrderDto.totalPrice,
      );
    }

    return order;
  }

  findAll() {
    return this.orderModel.find();
  }

  findOne(id: number) {
    return this.orderModel.findById(id);
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.orderModel.findByIdAndUpdate(id, updateOrderDto);
  }

  remove(id: number) {
    return this.orderModel.findByIdAndDelete(id);
  }
}
