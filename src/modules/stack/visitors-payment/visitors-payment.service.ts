import { Injectable } from '@nestjs/common';
import {
  CreateVisitorsPaymentDto,
  UpdateVisitorsPaymentDto,
} from './dto/create-visitors-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VisitorsPayment,
  VisitorsPaymentDocument,
} from './entities/visitors-payment.entity';
import {
  VisitorsInvoice,
  VisitorsInvoiceDocument,
} from '../visitors-invoice/entities/visitors-invoice.entity';
import { VisitorsService } from '../visitors/visitors.service';

@Injectable()
export class VisitorsPaymentService {
  constructor(
    @InjectModel(VisitorsPayment.name)
    private paymentModel: Model<VisitorsPaymentDocument>,
    @InjectModel(VisitorsInvoice.name)
    private invoiceModel: Model<VisitorsInvoiceDocument>,
    private visitorsService: VisitorsService,
  ) {}

  async create(createVisitorsPaymentDto: CreateVisitorsPaymentDto) {
    const { invoiceId, amountPaid, isPartial } = createVisitorsPaymentDto;

    // Verificar se a fatura existe
    const invoice = await this.invoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    // Criar o pagamento
    const payment = await this.paymentModel.create({
      invoiceId,
      amountPaid,
      isPartial,
      paymentDate: new Date(),
      createdAt: new Date(),
    });

    // Atualizar o valor pago e o status da fatura
    const newPaidAmount = invoice.paidAmount + amountPaid;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await this.invoiceModel.findByIdAndUpdate(invoiceId, {
      paidAmount: newPaidAmount,
      status: newStatus,
    });

    return payment;
  }

  async findAll() {
    // 1. Buscar todos os pagamentos ordenados por data (mais recentes primeiro)
    const payments = await this.paymentModel
      .find()
      .sort({ paymentDate: -1 })
      .lean();

    if (payments.length === 0) {
      return [];
    }

    // 2. Criar um mapa de invoiceIds para evitar buscas duplicadas
    const invoiceIds = [
      ...new Set(payments.map((payment) => payment.invoiceId)),
    ];

    // 3. Buscar todas as faturas relacionadas aos pagamentos
    const invoices = await this.invoiceModel
      .find({
        _id: { $in: invoiceIds },
      })
      .lean();

    // 4. Criar um mapa de buyerIds (IDs dos visitantes) para evitar buscas duplicadas
    const buyerIds = [
      ...new Set(invoices.map((invoice) => invoice.buyerId)),
    ].filter(Boolean);

    // 5. Buscar os nomes dos visitantes
    const visitorNames = {};
    for (const buyerId of buyerIds) {
      try {
        const visitor = await this.visitorsService.findVisitorNameAndPhoneById(
          buyerId,
        );
        visitorNames[buyerId] = visitor?.name || 'Visitante não encontrado';
      } catch (error) {
        console.error(
          `Erro ao buscar visitante com ID ${buyerId}:`,
          error.message,
        );
        visitorNames[buyerId] = 'Visitante não encontrado';
      }
    }

    // 6. Criar um mapa de faturas para fácil acesso
    const invoiceMap = {};
    for (const invoice of invoices) {
      invoiceMap[invoice._id.toString()] = invoice;
    }

    // 7. Adicionar informações adicionais aos pagamentos
    const paymentsWithDetails = payments.map((payment) => {
      const invoice = invoiceMap[payment.invoiceId];

      if (!invoice) {
        return {
          ...payment,
          visitorName: 'Fatura não encontrada',
          invoicePeriod: {
            startDate: null,
            endDate: null,
          },
        };
      }

      return {
        ...payment,
        visitorName:
          visitorNames[invoice.buyerId] || 'Visitante não encontrado',
        invoicePeriod: {
          startDate: invoice.startDate,
          endDate: invoice.endDate,
        },
        invoiceStatus: invoice.status,
        invoiceTotalAmount: invoice.totalAmount,
      };
    });

    return paymentsWithDetails;
  }

  async findByInvoiceId(invoiceId: string) {
    return this.paymentModel.find({ invoiceId }).exec();
  }

  async findOne(id: string) {
    return this.paymentModel.findById(id).exec();
  }

  async update(id: string, updateVisitorsPaymentDto: UpdateVisitorsPaymentDto) {
    return this.paymentModel
      .findByIdAndUpdate(id, updateVisitorsPaymentDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Verificar se o pagamento existe
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }

    // Atualizar a fatura relacionada
    const invoice = await this.invoiceModel.findById(payment.invoiceId);
    if (invoice) {
      const newPaidAmount = invoice.paidAmount - payment.amountPaid;
      let newStatus = invoice.status;

      if (newPaidAmount <= 0) {
        newStatus = 'OPEN';
      } else if (newPaidAmount < invoice.totalAmount) {
        newStatus = 'PARTIALLY_PAID';
      }

      await this.invoiceModel.findByIdAndUpdate(payment.invoiceId, {
        paidAmount: Math.max(0, newPaidAmount),
        status: newStatus,
      });
    }

    return this.paymentModel.findByIdAndDelete(id).exec();
  }
}
