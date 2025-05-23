import { PartialType } from '@nestjs/mapped-types';

export class CreateInvoiceDto {
  groupFamilyIds: string[];
  startDate: Date;
  endDate: Date;
}

export class FetchMultipleInvoicesDto {
  ids: string[];
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
export interface ConsumoItem {
  date: Date;
  products: ProductItem[];
}

export type InvoiceCreateResponse =
  | {
      created: true;
      invoice: FullInvoiceResponse;
      consumoPorPessoa: Record<string, ConsumoItem[]>;
    }
  | {
      updated: true;
      invoice: FullInvoiceResponse;
      consumoPorPessoa: Record<string, ConsumoItem[]>;
    };

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

export interface FullInvoiceResponse {
  _id: string;
  groupFamilyId: string;
  buyerIds: string[];
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  sentByWhatsapp: boolean;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID';
  createdAt: Date;
  orders: {
    _id: string;
    buyerId: string;
    groupFamilyId: string;
    products: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    totalPrice: number;
    createdAt: Date;
  }[];
  payments: {
    _id: string;
    amountPaid: number;
    isPartial: boolean;
    isCredit: boolean;
    paymentDate: Date;
    createdAt: Date;
  }[];
  consumoPorPessoa: Record<
    string,
    {
      date: Date;
      products: {
        id: string;
        name: string;
        price: number;
        quantity: number;
      }[];
    }[]
  >;
  remaining: number;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
