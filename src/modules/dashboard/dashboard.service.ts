import { DashDate } from 'src/shared/types/dashDate.type';
import { Injectable } from '@nestjs/common';
import { GroupFamilyService } from '../group-family/group-family.service';
import { InvoicesService as InvoiceService } from '../invoice/invoice.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { OrdersVisitorsService } from '../stack/orders-visitors/orders-visitors.service';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class DashboardService {
  constructor(
    private ordersService: OrdersService,
    private ordersVisitorsService: OrdersVisitorsService,
    private invoiceService: InvoiceService,
    private paymentsService: PaymentsService,
    private groupFamilyService: GroupFamilyService,
    private expensesService: ExpensesService,
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

  async findMostSoldProducts(date: DashDate) {
    return this.ordersService.findMostSoldProducts(date);
  }

  async findTopBuyers(date: DashDate) {
    return this.ordersService.findTopBuyers(date);
  }

  async findExpenses() {
    // Get all expenses
    const allExpenses = await this.expensesService.findAll();

    // Get all payments (revenues)
    const allPayments = await this.paymentsService.findAll();

    // Get current year
    const currentYear = new Date().getFullYear();

    // Filter expenses and payments for current year only
    const expensesCurrentYear = allExpenses.filter((expense) => {
      const expenseDate = expense.expenseDate
        ? new Date(expense.expenseDate)
        : new Date(expense.createdAt);
      return expenseDate.getFullYear() === currentYear;
    });

    const paymentsCurrentYear = allPayments.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      return paymentDate.getFullYear() === currentYear;
    });

    // Get all months from the start of the year until current month
    const currentMonth = new Date().getMonth();
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    // For year 2025, only include data from June onwards (month index 5)
    let startMonth = 0;
    if (currentYear === 2025) {
      startMonth = 5; // June is index 5 (0-based)
    }

    // Initialize arrays for chart data
    // Only include months from startMonth to currentMonth
    const monthCount = currentMonth - startMonth + 1;
    const payments = Array(monthCount).fill(0);
    const expenses = Array(monthCount).fill(0);
    const xLabels = [];
    const months = [];

    // Populate xLabels with month names from startMonth until current month
    for (let i = startMonth; i <= currentMonth; i++) {
      xLabels.push(monthNames[i]);
      months.push(i);
    }

    // Calculate total expenses by month
    expensesCurrentYear.forEach((expense) => {
      const expenseDate = expense.expenseDate
        ? new Date(expense.expenseDate)
        : new Date(expense.createdAt);
      const month = expenseDate.getMonth();

      // Only include months from startMonth up to currentMonth
      if (month >= startMonth && month <= currentMonth) {
        // Adjust the index to account for the startMonth offset
        const adjustedIndex = month - startMonth;
        expenses[adjustedIndex] += expense.expenseValue;
      }
    });

    // Calculate total revenues by month
    paymentsCurrentYear.forEach((payment) => {
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      const month = paymentDate.getMonth();

      // Only include months from startMonth up to currentMonth
      if (month >= startMonth && month <= currentMonth) {
        // Adjust the index to account for the startMonth offset
        const adjustedIndex = month - startMonth;
        payments[adjustedIndex] += payment.amountPaid;
      }
    });

    // Round values to 2 decimal places
    payments.forEach((value, index) => {
      payments[index] = Math.round(value * 100) / 100;
    });

    expenses.forEach((value, index) => {
      expenses[index] = Math.round(value * 100) / 100;
    });

    return {
      payments,
      expenses,
      xLabels,
    };
  }
}
