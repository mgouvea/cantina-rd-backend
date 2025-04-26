import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './entities/invoice.entity';
import { CreateInvoiceDto, UserStatement } from './dto/create-invoice.dto';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { Payment, PaymentDocument } from '../payments/entities/payment.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,

    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { buyerId, groupFamilyId, startDate, endDate } = createInvoiceDto;

    // 1. Verifica se já existe fatura em aberto
    const openInvoice = await this.invoiceModel.findOne({
      buyerId,
      status: { $in: ['OPEN', 'PARTIALLY_PAID'] },
    });

    // 2. Busca pedidos sem invoice dentro do período
    const orders = await this.orderModel.find({
      buyerId,
      groupFamilyId,
      invoiceId: { $exists: false },
      createdAt: { $gte: startDate, $lte: endDate },
    });

    if (orders.length === 0) {
      throw new Error('Nenhum novo pedido encontrado no período informado.');
    }

    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0,
    );

    if (openInvoice) {
      // Atualiza fatura existente
      await this.invoiceModel.findByIdAndUpdate(openInvoice._id, {
        $inc: { totalAmount },
      });

      await Promise.all(
        orders.map((order) =>
          this.orderModel.updateOne(
            { _id: order._id },
            { invoiceId: openInvoice._id },
          ),
        ),
      );

      return { updated: true, invoice: openInvoice };
    } else {
      // Cria nova fatura
      const newInvoice = await this.invoiceModel.create({
        buyerId,
        groupFamilyId,
        startDate,
        endDate,
        totalAmount,
        status: 'OPEN',
        createdAt: new Date(),
      });

      await Promise.all(
        orders.map((order) =>
          this.orderModel.updateOne(
            { _id: order._id },
            { invoiceId: newInvoice._id },
          ),
        ),
      );

      return { created: true, invoice: newInvoice };
    }
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
    let totalPaidToInvoices = 0;
    let totalCredit = 0;

    for (const payment of payments) {
      totalPaid += payment.amountPaid;

      if (payment.isCredit) {
        totalCredit += payment.amountPaid;
      } else {
        totalPaidToInvoices += payment.amountPaid;
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
}
