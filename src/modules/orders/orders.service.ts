import { Injectable } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './entities/order.entity';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { InjectModel } from '@nestjs/mongoose';
import { GroupFamilyService } from '../group-family/group-family.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly whatsappService: WhatsappService,
    private readonly userService: UsersService,
    private readonly groupFamilyService: GroupFamilyService,
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
    const orderTime = createdAt;

    // 3. Envia a mensagem se tiver número
    if (buyerPhone) {
      await this.whatsappService.sendPurchaseConfirmation(
        buyerName,
        buyerPhone,
        orderTime,
        createOrderDto.products,
      );
    }

    return order;
  }

  async findAll() {
    const orders = await this.orderModel.find();

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        // Buscar o nome do comprador
        const user = await this.userService.findUserNameAndPhoneById(
          order.buyerId,
        );

        // Buscar o nome do grupo familiar
        const groupFamilyName =
          await this.groupFamilyService.findGroupFamilyName(
            order.groupFamilyId,
          );

        return {
          ...order.toObject(),
          buyerName: user?.name || '',
          groupFamilyName: groupFamilyName || '',
        };
      }),
    );

    return ordersWithDetails;
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
