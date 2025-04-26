import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { Invoice, InvoiceDocument } from '../invoice/entities/invoice.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,

    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const createdPayment = await this.paymentModel.create(createPaymentDto);

    // Atualiza status da invoice automaticamente
    const payments = await this.paymentModel.find({
      invoiceId: createPaymentDto.invoiceId,
    });

    const totalPaid = payments.reduce(
      (sum, p) => sum + p.amountPaid,
      createPaymentDto.amountPaid,
    );

    const invoice = await this.invoiceModel.findById(
      createPaymentDto.invoiceId,
    );

    if (invoice) {
      const status =
        totalPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
      await this.invoiceModel.findByIdAndUpdate(invoice._id, { status });
    }

    return createdPayment;
  }

  async findAll() {
    return this.paymentModel.find();
  }

  async findOne(id: string) {
    return this.paymentModel.findById(id);
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    return this.paymentModel.findByIdAndUpdate(id, updatePaymentDto, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.paymentModel.findByIdAndDelete(id);
  }
}
