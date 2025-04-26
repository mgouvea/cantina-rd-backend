import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './entities/invoice.entity';
import {
  CreateInvoiceDto,
  FullInvoiceResponse,
  UserStatement,
} from './dto/create-invoice.dto';
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
    const { groupFamilyId, startDate, endDate } = createInvoiceDto;

    const orders = await this.orderModel.find({
      groupFamilyId,
      invoiceId: { $exists: false },
      createdAt: { $gte: startDate, $lte: endDate },
    });

    if (orders.length === 0) {
      throw new Error('Nenhum novo pedido encontrado no período informado.');
    }

    const buyerIds = [...new Set(orders.map((o) => o.buyerId))];
    const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);

    const consumoPorPessoa: Record<string, any[]> = {};
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
      await this.invoiceModel.findByIdAndUpdate(openInvoice._id, {
        $inc: { totalAmount },
        $addToSet: { buyerIds: { $each: buyerIds } },
      });

      await Promise.all(
        orders.map((order) =>
          this.orderModel.updateOne(
            { _id: order._id },
            { invoiceId: openInvoice._id },
          ),
        ),
      );

      return {
        updated: true,
        invoice: openInvoice,
        consumoPorPessoa,
      };
    }

    const newInvoice = await this.invoiceModel.create({
      groupFamilyId,
      buyerIds,
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

    return {
      created: true,
      invoice: newInvoice,
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

  async getFullInvoice(invoiceId: string): Promise<FullInvoiceResponse> {
    const invoice = await this.invoiceModel.findById(invoiceId).lean();
    if (!invoice) throw new Error('Fatura não encontrada');

    const ordersRaw = await this.orderModel.find({ invoiceId }).lean();
    const paymentsRaw = await this.paymentModel.find({ invoiceId }).lean();

    // Mapeia _id para string nos orders
    const orders = ordersRaw.map((order) => ({
      _id: order._id.toString(),
      buyerId: order.buyerId,
      groupFamilyId: order.groupFamilyId,
      products: order.products,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    }));

    // Mapeia _id para string nos payments
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

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = invoice.totalAmount - totalPaid;

    return {
      _id: invoice._id.toString(),
      groupFamilyId: invoice.groupFamilyId,
      buyerIds: invoice.buyerIds,
      startDate: invoice.startDate,
      endDate: invoice.endDate,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      createdAt: invoice.createdAt,
      orders,
      payments,
      consumoPorPessoa,
      remaining,
    };
  }
}
