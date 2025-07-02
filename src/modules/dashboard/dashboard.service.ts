import { DashDate } from 'src/shared/types/dashDate.type';
import { Injectable } from '@nestjs/common';
import { GroupFamilyService } from '../group-family/group-family.service';
import { InvoicesService as InvoiceService } from '../invoice/invoice.service';
import { OrdersService } from '../orders/orders.service';
import { OrdersVisitorsService } from '../orders-visitors/orders-visitors.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DashboardService {
  constructor(
    private ordersService: OrdersService,
    private ordersVisitorsService: OrdersVisitorsService,
    private invoiceService: InvoiceService,
    private paymentsService: PaymentsService,
    private groupFamilyService: GroupFamilyService,
  ) {}

  async findTotalContents(date: DashDate) {
    const getTotalOrders = await this.ordersService.findTotalOrders(date);
    const getTotalOrdersVisitors =
      await this.ordersVisitorsService.findTotalOrders(date);

    const totalOrders = getTotalOrders + getTotalOrdersVisitors;

    const totalPayments = await this.paymentsService.findTotalPayments(date);
    const totalOpenInvoices = await this.invoiceService.findTotalOpenInvoices(
      date,
    );
    const totalOpenInvoicesWithoutDateRange =
      await this.invoiceService.findTotalOpenInvoicesWithoutDateRange();

    return {
      totalOrders,
      totalPayments,
      totalOpenInvoices,
      totalOpenInvoicesWithoutDateRange,
    };
  }

  async findGroupFamiliesInvoicesOpen(date: DashDate) {
    // Buscar todas as faturas em aberto
    const openInvoicesResult = await this.invoiceService.findTotalOpenInvoices(
      date,
      true,
    );

    // Verificar se o resultado é um array (quando isGroupFamilySearch=true)
    // Se não for um array, retornar um array vazio
    if (!Array.isArray(openInvoicesResult)) {
      return [];
    }

    const openInvoices = openInvoicesResult;

    // Buscar todos os grupos familiares com dados dos proprietários
    const groupFamilies = await this.groupFamilyService.findAllWithOwnerName();

    // Mapear as faturas para os grupos familiares correspondentes
    const result = [];

    // Para cada fatura em aberto, encontrar o grupo familiar correspondente
    for (const invoice of openInvoices) {
      // Verificar se a fatura tem um groupFamilyId válido
      if (invoice.groupFamilyId) {
        // Encontrar o grupo familiar correspondente
        const groupFamily = groupFamilies.find(
          (group) => group._id.toString() === invoice.groupFamilyId.toString(),
        );

        // Se encontrou o grupo familiar, adicionar ao resultado
        if (groupFamily) {
          // Verificar se o grupo já está no resultado
          const existingGroup = result.find(
            (item) => item._id.toString() === groupFamily._id.toString(),
          );

          if (existingGroup) {
            // Se o grupo já existe, somar o valor da fatura
            existingGroup.value += invoice.totalAmount;
          } else {
            // Se o grupo não existe, adicionar ao resultado
            result.push({
              _id: groupFamily._id,
              name: groupFamily.name,
              ownerName: groupFamily.ownerName,
              ownerAvatar: groupFamily.ownerAvatar,
              value: invoice.totalAmount,
            });
          }
        }
      }
    }

    return result;
  }
}
