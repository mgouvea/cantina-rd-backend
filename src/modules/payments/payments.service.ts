import {
  BadRequestException,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { Invoice, InvoiceDocument } from '../invoice/entities/invoice.entity';
import { GroupFamilyService } from '../group-family/group-family.service';
import { DashDate } from 'src/shared/types/dashDate.type';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,

    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,

    @Inject(forwardRef(() => GroupFamilyService))
    private groupFamilyService: GroupFamilyService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const invoice = await this.invoiceModel.findById(
      createPaymentDto.invoiceId,
    );

    if (!invoice) {
      throw new BadRequestException('Fatura não encontrada');
    }

    const createdPayment = await this.paymentModel.create(createPaymentDto);

    // Buscar todos os pagamentos desta fatura (incluindo o que acabou de ser criado)
    const payments = await this.paymentModel.find({
      invoiceId: createPaymentDto.invoiceId,
    });

    // Calcular o total pago corretamente
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    // Calcular o valor restante
    const remainingAmount = Math.max(0, invoice.totalAmount - totalPaid);

    // Determinar o novo status da fatura
    const status = totalPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    // Atualizar o status da fatura
    await this.invoiceModel.findByIdAndUpdate(invoice._id, { status });

    // Retornar o pagamento criado junto com informações sobre o valor restante
    return {
      ...createdPayment.toObject(),
      invoiceStatus: status,
      totalPaid,
      totalAmount: invoice.totalAmount,
      remainingAmount,
    };
  }

  async findAll() {
    const payments = await this.paymentModel.find().lean();

    // Criar um mapa de invoiceIds para evitar buscas duplicadas
    const invoiceIds = [
      ...new Set(payments.map((payment) => payment.invoiceId)),
    ];

    // Buscar todas as faturas relacionadas aos pagamentos
    const invoices = await this.invoiceModel
      .find({
        _id: { $in: invoiceIds },
      })
      .lean();

    // Criar um mapa de groupFamilyIds para evitar buscas duplicadas
    const groupFamilyIds = [
      ...new Set(invoices.map((invoice) => invoice.groupFamilyId)),
    ];

    // Buscar os nomes dos grupos familiares
    const groupFamilyNames = {};
    for (const groupFamilyId of groupFamilyIds) {
      groupFamilyNames[groupFamilyId] =
        await this.groupFamilyService.findGroupFamilyName(groupFamilyId);
    }

    // Criar um mapa de faturas para fácil acesso
    const invoiceMap = {};
    for (const invoice of invoices) {
      invoiceMap[invoice._id.toString()] = invoice;
    }

    // Adicionar informações adicionais aos pagamentos
    const paymentsWithDetails = payments.map((payment) => {
      const invoice = invoiceMap[payment.invoiceId];

      if (!invoice) {
        return {
          ...payment,
          groupFamilyName: 'Fatura não encontrada',
          invoicePeriod: {
            startDate: null,
            endDate: null,
          },
        };
      }

      return {
        ...payment,
        groupFamilyName:
          groupFamilyNames[invoice.groupFamilyId] || 'Grupo não encontrado',
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

  async findOne(id: string) {
    return this.paymentModel.findById(id);
  }

  async findTotalPayments(dateRange: DashDate) {
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

    const payments = await this.paymentModel
      .find({
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .exec();

    return payments.reduce((total, payment) => total + payment.amountPaid, 0);
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
