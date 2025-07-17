import { ProductItem } from 'src/modules/orders/dto/create-order.dto';

export type FullVisitorsInvoiceResponse = {
  _id: string;
  buyerId: string;
  startDate: Date;
  endDate: Date;
  sentByWhatsapp: boolean;
  totalAmount: number;
  paidAmount: number;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID';
  createdAt: Date;
  orders: {
    _id: string;
    buyerId: string;
    products: ProductItem[];
    totalPrice: number;
    createdAt: Date;
  }[];
  payments: {
    _id: string;
    amountPaid: number;
    isPartial: boolean;
    paymentDate: Date;
    createdAt: Date;
  }[];
  consumoPorPessoa: Record<string, { date: Date; products: ProductItem[] }[]>;
  consumidoresNomes: Record<string, string>;
  remaining: number;
};
