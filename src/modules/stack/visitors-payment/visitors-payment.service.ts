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

@Injectable()
export class VisitorsPaymentService {
  constructor(
    @InjectModel(VisitorsPayment.name)
    private paymentModel: Model<VisitorsPaymentDocument>,
    @InjectModel(VisitorsInvoice.name)
    private invoiceModel: Model<VisitorsInvoiceDocument>,
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
    return this.paymentModel.find().exec();
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
