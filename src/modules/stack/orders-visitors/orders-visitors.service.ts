import { BadRequestException, Injectable } from '@nestjs/common';
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
import { VisitorsService } from '../visitors/visitors.service';
import { DashDate } from 'src/shared/types/dashDate.type';
import { EvolutionWhatsappService } from 'src/modules/evolution-whatsapp/evolution-whatsapp.service';

@Injectable()
export class OrdersVisitorsService {
  constructor(
    @InjectModel(OrdersVisitor.name)
    private ordersVisitorModel: Model<OrdersVisitorDocument>,
    private visitorsService: VisitorsService,
    private whatsappService: EvolutionWhatsappService,
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
    // 1. Buscar todos os pedidos com sort por data de criação (mais recentes primeiro)
    const ordersVisitors = await this.ordersVisitorModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    if (ordersVisitors.length === 0) {
      return [];
    }

    // 2. Agrupar os IDs dos compradores para fazer uma busca única
    const buyerIds = [
      ...new Set(ordersVisitors.map((order) => order.buyerId)),
    ].filter(Boolean);

    if (buyerIds.length === 0) {
      return ordersVisitors;
    }

    try {
      // 3. Buscar informações dos visitantes em paralelo
      const visitorsData = await Promise.all(
        buyerIds.map(async (id) => {
          try {
            const visitor =
              await this.visitorsService.findVisitorNameAndPhoneById(id);
            return visitor ? { id: id.toString(), visitor } : null;
          } catch (error) {
            console.error(
              `Erro ao buscar visitante com ID ${id}:`,
              error.message,
            );
            return null;
          }
        }),
      );

      // 4. Criar um mapa para acesso rápido
      const visitorMap = new Map();
      visitorsData.filter(Boolean).forEach((data) => {
        if (data && data.visitor) {
          visitorMap.set(data.id, data.visitor);
        }
      });

      // 5. Atribuir os nomes e churchCore aos pedidos
      for (const order of ordersVisitors) {
        if (order.buyerId) {
          const visitor = visitorMap.get(order.buyerId.toString());
          if (visitor) {
            order.buyerName = visitor.name;
            order.churchCore = visitor.churchCore;
          } else {
            // Tratamento para visitantes que não existem mais
            order.buyerName = 'Visitante não encontrado';
            order.churchCore = null;
          }
        } else {
          order.buyerName = 'ID de visitante inválido';
          order.churchCore = null;
        }
      }
    } catch (error) {
      console.error('Erro ao processar visitantes:', error);
      // Mesmo com erro, retornamos os pedidos sem os nomes dos compradores
    }

    return ordersVisitors;
  }

  findOne(id: string) {
    return this.ordersVisitorModel.findById(id).exec();
  }

  findOrdersWithRange(visitorId: string, dateRange: DashDate) {
    return this.ordersVisitorModel
      .find({
        buyerId: visitorId,
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .exec();
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

  update(id: string, updateOrdersVisitorDto: UpdateOrdersVisitorDto) {
    return this.ordersVisitorModel
      .findByIdAndUpdate(id, updateOrdersVisitorDto)
      .exec();
  }

  async remove(id: string) {
    const order = await this.ordersVisitorModel.findById(id);

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.invoiceId) {
      throw new BadRequestException(
        'Este pedido não pode ser excluído pois está associado a uma fatura',
      );
    }

    return this.ordersVisitorModel.findByIdAndDelete(id);
  }
}
