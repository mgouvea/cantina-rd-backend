import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateVisitorsInvoiceDto,
  UpdateVisitorsInvoiceDto,
} from './dto/create-visitors-invoice.dto';
import {
  VisitorsInvoice,
  VisitorsInvoiceDocument,
} from './entities/visitors-invoice.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrdersVisitorsService } from '../orders-visitors/orders-visitors.service';
import { VisitorsService } from '../visitors/visitors.service';
import { ModuleRef } from '@nestjs/core';
import { FullVisitorsInvoiceResponse } from './types/full-invoice-response.type';
import {
  OrdersVisitor,
  OrdersVisitorDocument,
} from '../orders-visitors/entities/orders-visitor.entity';
// Removido import não utilizado
import {
  VisitorsPayment,
  VisitorsPaymentDocument,
} from '../visitors-payment/entities/visitors-payment.entity';

@Injectable()
export class VisitorsInvoiceService {
  constructor(
    @InjectModel(VisitorsInvoice.name)
    private invoiceModel: Model<VisitorsInvoiceDocument>,
    @InjectModel(OrdersVisitor.name)
    private orderModel: Model<OrdersVisitorDocument>,
    @InjectModel(VisitorsPayment.name)
    private paymentModel: Model<VisitorsPaymentDocument>,
    private ordersVisitorsService: OrdersVisitorsService,
    private moduleRef: ModuleRef,
  ) {}

  async create(createVisitorsInvoiceDto: CreateVisitorsInvoiceDto) {
    const { visitorsIds, startDate, endDate } = createVisitorsInvoiceDto;

    // Handle single groupFamilyId for backward compatibility
    if (!Array.isArray(visitorsIds) || visitorsIds.length === 0) {
      throw new Error('Pelo menos um visitante deve ser fornecido.');
    }

    // If only one group family ID is provided, use the original behavior
    if (visitorsIds.length === 1) {
      return this.createSingleInvoice(visitorsIds[0], startDate, endDate);
    }

    // Process multiple group family IDs
    const results = [];

    for (const visitorId of visitorsIds) {
      try {
        const result = await this.createSingleInvoice(
          visitorId,
          startDate,
          endDate,
        );
        results.push(result);
      } catch (error) {
        // Skip groups without orders and continue with the next one
        console.log(`Skipping group ${visitorId}: ${error.message}`);
      }
    }

    if (results.length === 0) {
      throw new BadRequestException(
        'Nenhum novo pedido encontrado no período informado para os grupos selecionados.',
      );
    }

    return results;
  }

  private async createSingleInvoice(
    visitorId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Garantir que as datas sejam objetos Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ajustar a data de início para o início do dia (00:00:00)
    start.setHours(0, 0, 0, 0);

    // Ajustar a data de fim para o final do dia (23:59:59.999)
    end.setHours(23, 59, 59, 999);

    const orders = await this.ordersVisitorsService.findOrdersWithRange(
      visitorId,
      { startDate: start, endDate: end },
    );

    if (orders.length === 0) {
      throw new BadRequestException(
        `Nenhum novo pedido encontrado no período informado para o visitante ${visitorId}.`,
      );
    }

    // Mapear os pedidos para o formato esperado na resposta
    const formattedOrders = orders.map((order) => ({
      _id: order._id.toString(),
      buyerId: order.buyerId,
      products: order.products,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    }));

    // Calcular o valor total dos pedidos
    const totalAmount = formattedOrders.reduce(
      (sum, o) => sum + o.totalPrice,
      0,
    );

    // Organizar o consumo do visitante
    const consumoPorPessoa: Record<string, { date: Date; products: any[] }[]> =
      {};
    consumoPorPessoa[visitorId] = orders.map((order) => {
      return {
        date: order.createdAt,
        products: order.products,
      };
    });

    // Verificar se já existe uma fatura aberta ou parcialmente paga para este visitante
    const openInvoice = await this.invoiceModel.findOne({
      buyerId: visitorId,
      status: { $in: ['OPEN', 'PARTIALLY_PAID'] },
    });

    if (openInvoice) {
      // Usar o valor já pago da fatura existente

      // Atualizar a fatura existente com o novo valor total
      await this.invoiceModel.findByIdAndUpdate(openInvoice._id, {
        $inc: { totalAmount },
        $set: {
          sentByWhatsapp: false, // Redefinir para false pois a fatura foi modificada
        },
      });

      // Atualizar os pedidos para associá-los à fatura
      await Promise.all(
        orders.map((order) =>
          this.ordersVisitorsService.update(order._id.toString(), {
            invoiceId: openInvoice._id.toString(),
          }),
        ),
      );

      const updatedInvoice = await this.invoiceModel
        .findById(openInvoice._id)
        .lean();

      // Calcular o valor restante (total - pago)
      const remaining = updatedInvoice.totalAmount - updatedInvoice.paidAmount;

      // Buscar nome do visitante
      let visitorName = 'Visitante não encontrado';
      try {
        const visitorsService = this.moduleRef.get(VisitorsService, {
          strict: false,
        });
        const visitor = await visitorsService.findVisitorNameAndPhoneById(
          visitorId,
        );
        visitorName = visitor?.name || 'Visitante não encontrado';
      } catch (error) {
        visitorName = 'Visitante não encontrado';
      }

      return {
        updated: true,
        invoice: {
          _id: updatedInvoice._id.toString(),
          buyerId: updatedInvoice.buyerId,
          startDate: updatedInvoice.startDate,
          endDate: updatedInvoice.endDate,
          sentByWhatsapp: updatedInvoice.sentByWhatsapp,
          totalAmount: updatedInvoice.totalAmount,
          paidAmount: updatedInvoice.paidAmount,
          status: updatedInvoice.status,
          createdAt: updatedInvoice.createdAt,
          orders: formattedOrders,
          payments: [],
          consumoPorPessoa,
          visitorName,
          remaining,
        },
      };
    }

    // Criar uma nova fatura
    const createdInvoice = await this.invoiceModel.create({
      buyerId: visitorId,
      startDate,
      endDate,
      totalAmount,
      paidAmount: 0, // Nova fatura, nenhum pagamento realizado ainda
      status: 'OPEN', // Fatura começa como aberta
      sentByWhatsapp: false,
      createdAt: new Date(),
    });

    const newInvoice = await this.invoiceModel
      .findById(createdInvoice._id)
      .lean();

    // Atualizar os pedidos para associá-los à fatura
    await Promise.all(
      orders.map((order) =>
        this.ordersVisitorsService.update(order._id.toString(), {
          invoiceId: createdInvoice._id.toString(),
        }),
      ),
    );

    // Buscar nome do visitante
    let visitorName = 'Visitante não encontrado';
    try {
      const visitorsService = this.moduleRef.get(VisitorsService, {
        strict: false,
      });
      const visitor = await visitorsService.findVisitorNameAndPhoneById(
        visitorId,
      );
      visitorName = visitor?.name || 'Visitante não encontrado';
    } catch (error) {
      visitorName = 'Visitante não encontrado';
    }

    return {
      created: true,
      invoice: {
        _id: newInvoice._id.toString(),
        buyerId: newInvoice.buyerId,
        startDate: newInvoice.startDate,
        endDate: newInvoice.endDate,
        sentByWhatsapp: newInvoice.sentByWhatsapp,
        totalAmount: newInvoice.totalAmount,
        paidAmount: newInvoice.paidAmount,
        status: newInvoice.status,
        createdAt: newInvoice.createdAt,
        orders: formattedOrders,
        payments: [],
        consumoPorPessoa,
        visitorName,
        remaining: newInvoice.totalAmount, // Nova fatura, valor restante = valor total
      },
    };
  }

  findAll() {
    return `This action returns all visitorsInvoice`;
  }

  findOne(id: string) {
    return this.invoiceModel.findById(id).exec();
  }

  update(id: string, updateVisitorsInvoiceDto: UpdateVisitorsInvoiceDto) {
    return this.invoiceModel
      .findByIdAndUpdate(id, updateVisitorsInvoiceDto)
      .exec();
  }

  async remove(id: string) {
    // 1. Buscar a fatura antes de excluí-la para obter informações
    const invoice = await this.invoiceModel.findById(id).exec();

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    // 2. Buscar todos os pedidos associados a esta fatura
    const orders = await this.orderModel.find({ invoiceId: id }).exec();

    // 3. Atualizar cada pedido para remover a referência à fatura
    if (orders && orders.length > 0) {
      await Promise.all(
        orders.map(async (order) => {
          // Remover a propriedade invoiceId de cada pedido
          return this.orderModel
            .findByIdAndUpdate(
              order._id,
              { $unset: { invoiceId: 1 } },
              { new: true },
            )
            .exec();
        }),
      );

      console.log(
        `Removida referência da fatura ${id} de ${orders.length} pedidos`,
      );
    }

    // 4. Excluir a fatura
    return this.invoiceModel.findByIdAndDelete(id).exec();
  }

  async getFullInvoices(
    buyerIds: string[],
  ): Promise<FullVisitorsInvoiceResponse[]> {
    try {
      const invoicesRaw = await this.invoiceModel
        .find({
          buyerId: { $in: buyerIds },
        })
        .lean();

      if (invoicesRaw.length === 0) {
        throw new Error('Nenhuma fatura encontrada.');
      }

      const results: FullVisitorsInvoiceResponse[] = [];
      const visitorsService = this.moduleRef.get(VisitorsService, {
        strict: false,
      });

      for (const invoice of invoicesRaw) {
        const ordersRaw = await this.orderModel
          .find({ invoiceId: invoice._id })
          .lean();

        // Buscar pagamentos associados à fatura
        const paymentsRaw = await this.paymentModel
          .find({ invoiceId: invoice._id })
          .lean();

        const orders = ordersRaw.map((order) => ({
          _id: order._id.toString(),
          buyerId: order.buyerId,
          products: order.products,
          totalPrice: order.totalPrice,
          createdAt: order.createdAt,
        }));

        const payments = paymentsRaw.map((payment) => ({
          _id: payment._id.toString(),
          amountPaid: payment.amountPaid,
          isPartial: payment.isPartial,
          paymentDate: payment.paymentDate,
          createdAt: payment.createdAt,
        }));

        const consumoPorPessoa: Record<
          string,
          { date: Date; products: any[] }[]
        > = {};
        for (const order of ordersRaw) {
          const buyer = order.buyerId;
          if (!consumoPorPessoa[buyer]) {
            consumoPorPessoa[buyer] = [];
          }
          consumoPorPessoa[buyer].push({
            date: order.createdAt,
            products: order.products,
          });
        }

        // Buscar nome do comprador (visitante)
        let visitorName = 'Visitante não encontrado';
        try {
          const visitor = await visitorsService.findVisitorNameAndPhoneById(
            invoice.buyerId,
          );
          visitorName = visitor?.name || 'Visitante não encontrado';
        } catch (error) {
          visitorName = 'Visitante não encontrado';
        }

        // Calcular o valor total pago e o valor restante
        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const remaining = invoice.totalAmount - totalPaid;

        results.push({
          _id: invoice._id.toString(),
          buyerId: invoice.buyerId,
          startDate: invoice.startDate,
          endDate: invoice.endDate,
          sentByWhatsapp: invoice.sentByWhatsapp,
          totalAmount: invoice.totalAmount,
          paidAmount: totalPaid,
          status: invoice.status,
          createdAt: invoice.createdAt,
          orders,
          payments,
          consumoPorPessoa,
          visitorName,
          remaining,
        });
      }

      return results;
    } catch (error) {
      throw new NotFoundException('Nenhuma fatura encontrada');
    }
  }
}
