import { PartialType } from '@nestjs/mapped-types';

export class CreateInvoiceDto {
  buyerId: string;
  groupFamilyId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID';
  createdAt: Date;
}

export interface InvoiceWithOrders {
  _id: any;
  buyerId: string;
  groupFamilyId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: string;
  createdAt: Date;
  orders: any[];
  paidAmount: number;
  remaining: number;
}

export interface PaymentData {
  _id: any;
  invoiceId?: string;
  amountPaid: number;
  paymentDate: Date;
  isPartial: boolean;
  isCredit: boolean;
  createdAt: Date;
}

export interface UserStatement {
  buyerId: string;
  invoices: InvoiceWithOrders[];
  payments: PaymentData[];
  summary: {
    totalDebt: number;
    totalPaid: number;
    credit: number;
    availableBalance: number;
  };
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
