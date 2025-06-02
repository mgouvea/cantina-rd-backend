import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './entities/invoice.entity';
import {
  ConsumoItem,
  CreateInvoiceDto,
  FullInvoiceResponse,
  InvoiceCreateResponse,
  UserStatement,
} from './dto/create-invoice.dto';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { Payment, PaymentDocument } from '../payments/entities/payment.entity';
import { ModuleRef } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  GroupFamily,
  GroupFamilyDocument,
} from '../group-family/entities/group-family.entity';
// import { InvoiceItem } from 'src/shared/types/invoice.types';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,

    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,

    @InjectModel(GroupFamily.name)
    private groupFamilyModel: Model<GroupFamilyDocument>,

    private moduleRef: ModuleRef,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceCreateResponse | InvoiceCreateResponse[]> {
    const { groupFamilyIds, startDate, endDate } = createInvoiceDto;

    // Handle single groupFamilyId for backward compatibility
    if (!Array.isArray(groupFamilyIds) || groupFamilyIds.length === 0) {
      throw new Error('Pelo menos um ID de grupo familiar deve ser fornecido.');
    }

    // If only one group family ID is provided, use the original behavior
    if (groupFamilyIds.length === 1) {
      return this.createSingleInvoice(groupFamilyIds[0], startDate, endDate);
    }

    // Process multiple group family IDs
    const results: InvoiceCreateResponse[] = [];

    for (const groupFamilyId of groupFamilyIds) {
      try {
        const result = await this.createSingleInvoice(
          groupFamilyId,
          startDate,
          endDate,
        );
        results.push(result);
      } catch (error) {
        // Skip groups without orders and continue with the next one
        console.log(`Skipping group ${groupFamilyId}: ${error.message}`);
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
    groupFamilyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<InvoiceCreateResponse> {
    // Garantir que as datas sejam objetos Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ajustar a data de início para o início do dia (00:00:00)
    start.setHours(0, 0, 0, 0);

    // Ajustar a data de fim para o final do dia (23:59:59.999)
    end.setHours(23, 59, 59, 999);

    const orders = await this.orderModel.find({
      groupFamilyId,
      invoiceId: { $exists: false },
      createdAt: { $gte: start, $lte: end },
    });

    if (orders.length === 0) {
      throw new BadRequestException(
        `Nenhum novo pedido encontrado no período informado para o grupo ${groupFamilyId}.`,
      );
    }

    const buyerIds = [...new Set(orders.map((o) => o.buyerId))];
    const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);

    const consumoPorPessoa: Record<string, ConsumoItem[]> = {};
    for (const order of orders) {
      const buyer = order.buyerId;
      if (!consumoPorPessoa[buyer]) {
        consumoPorPessoa[buyer] = [];
      }
      consumoPorPessoa[buyer].push({
        date: order.createdAt,
        products: order.products,
      });
    }

    const openInvoice = await this.invoiceModel.findOne({
      groupFamilyId,
      status: { $in: ['OPEN', 'PARTIALLY_PAID'] },
    });

    if (openInvoice) {
      // Buscar pagamentos existentes para calcular o valor já pago
      const payments = await this.paymentModel
        .find({ invoiceId: openInvoice._id })
        .lean();
      const paidAmount = payments.reduce((sum, p) => sum + p.amountPaid, 0);

      // Atualizar a fatura existente com o novo valor total e o valor já pago
      await this.invoiceModel.findByIdAndUpdate(openInvoice._id, {
        $inc: { totalAmount },
        $addToSet: { buyerIds: { $each: buyerIds } },
        $set: {
          sentByWhatsapp: false, // Redefinir para false pois a fatura foi modificada
          paidAmount: paidAmount, // Salvar o valor já pago
        },
      });

      await Promise.all(
        orders.map((order) =>
          this.orderModel.updateOne(
            { _id: order._id },
            { invoiceId: openInvoice._id },
          ),
        ),
      );

      const updatedInvoice = await this.invoiceModel
        .findById(openInvoice._id)
        .lean();

      // Calcular o valor restante (total - pago)
      const remaining = updatedInvoice.totalAmount - updatedInvoice.paidAmount;

      return {
        updated: true,
        invoice: {
          _id: updatedInvoice._id.toString(),
          groupFamilyId: updatedInvoice.groupFamilyId,
          buyerIds: updatedInvoice.buyerIds,
          startDate: updatedInvoice.startDate,
          endDate: updatedInvoice.endDate,
          sentByWhatsapp: updatedInvoice.sentByWhatsapp,
          totalAmount: updatedInvoice.totalAmount,
          paidAmount: updatedInvoice.paidAmount,
          status: updatedInvoice.status,
          createdAt: updatedInvoice.createdAt,
          orders: [],
          payments: [],
          consumoPorPessoa,
          consumidoresNomes: {},
          ownerName: '',
          remaining: remaining,
        },
        consumoPorPessoa,
      };
    }

    const createdInvoice = await this.invoiceModel.create({
      groupFamilyId,
      buyerIds,
      startDate,
      endDate,
      totalAmount,
      paidAmount: 0, // Nova fatura, nenhum pagamento realizado ainda
      status: 'OPEN',
      sentByWhatsapp: false,
      createdAt: new Date(),
    });

    const newInvoice = await this.invoiceModel
      .findById(createdInvoice._id)
      .lean();

    await Promise.all(
      orders.map((order) =>
        this.orderModel.updateOne(
          { _id: order._id },
          { invoiceId: createdInvoice._id },
        ),
      ),
    );

    return {
      created: true,
      invoice: {
        _id: newInvoice._id.toString(),
        groupFamilyId: newInvoice.groupFamilyId,
        buyerIds: newInvoice.buyerIds,
        startDate: newInvoice.startDate,
        endDate: newInvoice.endDate,
        sentByWhatsapp: newInvoice.sentByWhatsapp,
        totalAmount: newInvoice.totalAmount,
        paidAmount: newInvoice.paidAmount,
        status: newInvoice.status,
        createdAt: newInvoice.createdAt,
        orders: [],
        payments: [],
        consumoPorPessoa,
        consumidoresNomes: {},
        ownerName: '',
        remaining: newInvoice.totalAmount, // Nova fatura, valor restante = valor total
      },
      consumoPorPessoa,
    };
  }

  async findAll() {
    return this.invoiceModel.find();
  }

  async findOne(id: string) {
    return this.invoiceModel.findById(id);
  }

  async getOrdersByInvoice(invoiceId: string) {
    return this.orderModel.find({ invoiceId });
  }

  async getUserStatement(buyerId: string): Promise<UserStatement> {
    const invoices = await this.invoiceModel.find({ buyerId }).lean();
    const payments = await this.paymentModel.find({ buyerId }).lean();

    const invoiceIds = invoices.map((inv) => inv._id.toString());

    const orders = await this.orderModel
      .find({ invoiceId: { $in: invoiceIds } })
      .lean();

    // Agrupa pedidos por invoice
    const ordersGrouped: Record<string, any[]> = {};
    for (const order of orders) {
      const invId = order.invoiceId?.toString();
      if (!ordersGrouped[invId]) ordersGrouped[invId] = [];
      ordersGrouped[invId].push(order);
    }

    // Agrupa pagamentos por invoice
    const paymentsGrouped: Record<string, number> = {};
    let totalPaid = 0;
    let totalCredit = 0;

    for (const payment of payments) {
      totalPaid += payment.amountPaid;

      if (payment.isCredit) {
        totalCredit += payment.amountPaid;
      } else {
        const invId = payment.invoiceId?.toString();
        paymentsGrouped[invId] =
          (paymentsGrouped[invId] || 0) + payment.amountPaid;
      }
    }

    // Monta detalhes de cada fatura
    const invoiceDetails = invoices.map((invoice) => {
      const invId = invoice._id.toString();
      const invOrders = ordersGrouped[invId] || [];
      const paidAmount = paymentsGrouped[invId] || 0;

      return {
        ...invoice,
        buyerId,
        orders: invOrders,
        paidAmount,
        remaining: invoice.totalAmount - paidAmount,
      };
    });

    const totalDebt = invoiceDetails.reduce(
      (acc, inv) => acc + inv.remaining,
      0,
    );
    const availableBalance = totalCredit - totalDebt;

    return {
      buyerId,
      invoices: invoiceDetails,
      payments,
      summary: {
        totalDebt,
        totalPaid,
        credit: totalCredit,
        availableBalance,
      },
    };
  }

  async getFullInvoices(invoiceIds: string[]): Promise<FullInvoiceResponse[]> {
    const invoicesRaw = await this.invoiceModel
      .find({
        _id: { $in: invoiceIds },
      })
      .lean();

    if (invoicesRaw.length === 0) {
      throw new Error('Nenhuma fatura encontrada.');
    }

    const results: FullInvoiceResponse[] = [];
    const userService = this.moduleRef.get(UsersService, { strict: false });

    for (const invoice of invoicesRaw) {
      const ordersRaw = await this.orderModel
        .find({ invoiceId: invoice._id })
        .lean();
      const paymentsRaw = await this.paymentModel
        .find({ invoiceId: invoice._id })
        .lean();

      const orders = ordersRaw.map((order) => ({
        _id: order._id.toString(),
        buyerId: order.buyerId,
        groupFamilyId: order.groupFamilyId,
        products: order.products,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
      }));

      const payments = paymentsRaw.map((payment) => ({
        _id: payment._id.toString(),
        amountPaid: payment.amountPaid,
        isPartial: payment.isPartial,
        isCredit: payment.isCredit,
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
      }));

      const consumoPorPessoa: Record<string, any[]> = {};
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

      // Buscar o grupo familiar para obter o responsável
      const groupFamily = await this.groupFamilyModel.findById(
        invoice.groupFamilyId,
      );

      let ownerName = '';
      if (groupFamily) {
        try {
          const owner = await userService.findUserNameAndPhoneById(
            groupFamily.owner,
          );
          ownerName = owner?.name || 'Responsável não encontrado';
        } catch (error) {
          ownerName = 'Responsável não encontrado';
        }
      }

      // Buscar nomes dos compradores
      const consumidoresNomes: Record<string, string> = {};
      for (const buyerId of Object.keys(consumoPorPessoa)) {
        try {
          const buyer = await userService.findUserNameAndPhoneById(buyerId);
          consumidoresNomes[buyerId] = buyer?.name || 'Usuário não encontrado';
        } catch (error) {
          consumidoresNomes[buyerId] = 'Usuário não encontrado';
        }
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
      const remaining = invoice.totalAmount - totalPaid;

      results.push({
        _id: invoice._id.toString(),
        groupFamilyId: invoice.groupFamilyId,
        buyerIds: invoice.buyerIds,
        startDate: invoice.startDate,
        endDate: invoice.endDate,
        sentByWhatsapp: invoice.sentByWhatsapp,
        totalAmount: invoice.totalAmount,
        paidAmount: totalPaid, // Adicionar o valor pago
        status: invoice.status,
        createdAt: invoice.createdAt,
        orders,
        payments,
        consumoPorPessoa,
        consumidoresNomes,
        ownerName,
        remaining,
      });
    }

    return results;
  }

  async sendInvoiceByWhatsapp(invoiceId: string) {
    try {
      // Buscar a fatura completa
      const invoiceData = await this.getFullInvoices([invoiceId]);

      if (!invoiceData || invoiceData.length === 0) {
        throw new Error('Fatura não encontrada');
      }

      const invoice = invoiceData[0];

      // Buscar o grupo familiar para obter o responsável
      const groupFamily = await this.groupFamilyModel.findById(
        invoice.groupFamilyId,
      );

      if (!groupFamily) {
        throw new Error('Grupo familiar não encontrado');
      }

      // Buscar os dados do responsável do grupo
      const userService = this.moduleRef.get(UsersService, { strict: false });
      const owner = await userService.findUserNameAndPhoneById(
        groupFamily.owner,
      );

      if (!owner) {
        throw new Error('Responsável do grupo não encontrado');
      }

      if (!owner.telephone) {
        throw new Error('Responsável do grupo não possui telefone cadastrado');
      }

      // Agrupar consumo por pessoa
      const consumoPorPessoa: Record<string, any[]> = {};
      for (const order of invoice.orders) {
        const buyer = order.buyerId;
        if (!consumoPorPessoa[buyer]) {
          consumoPorPessoa[buyer] = [];
        }
        consumoPorPessoa[buyer].push({
          date: order.createdAt,
          products: order.products,
          totalPrice: order.totalPrice,
        });
      }

      // Buscar nomes dos compradores
      const buyerNames: Record<string, string> = {};
      for (const buyerId of Object.keys(consumoPorPessoa)) {
        try {
          const buyer = await userService.findUserNameAndPhoneById(buyerId);
          buyerNames[buyerId] = buyer?.name || 'Usuário não encontrado';
        } catch (error) {
          buyerNames[buyerId] = 'Usuário não encontrado';
        }
      }

      // Chamar o serviço de WhatsApp para enviar a mensagem
      const whatsappService = this.moduleRef.get(WhatsappService, {
        strict: false,
      });

      await whatsappService.sendInvoiceConfirmation(
        owner.name,
        owner.telephone,
        invoice.startDate,
        invoice.endDate,
        invoice.totalAmount,
        invoiceId,
        invoice.paidAmount,
        invoice.remaining,
      );

      // Atualizar a fatura para marcar como enviada por WhatsApp
      await this.invoiceModel.findByIdAndUpdate(invoiceId, {
        sentByWhatsapp: true,
      });

      return {
        success: true,
        message: `Fatura enviada com sucesso para ${owner.name} (${owner.telephone})`,
      };
    } catch (error) {
      console.error('Erro ao enviar fatura por WhatsApp:', error);
      return {
        success: false,
        message: `Erro ao enviar fatura: ${error.message}`,
      };
    }
  }

  async deleteInvoice(invoiceId: string) {
    await this.invoiceModel.findByIdAndDelete(invoiceId);
    return { message: 'Invoice deleted successfully' };
  }
}
