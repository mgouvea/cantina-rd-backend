import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ProductItem } from '../orders/dto/create-order.dto';
import {
  formatDateShort,
  formatDateTime,
  formatName,
} from 'src/shared/utils/helpers';

@Injectable()
export class EvolutionWhatsappService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly instanceName: string;
  private readonly pixKey: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.EVOLUTION_API_KEY;
    this.baseUrl = process.env.EVOLUTION_API_URL;
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'cantina-rd';
    this.pixKey = process.env.CANTINA_PIX_KEY || 'tes.realezadivina@udv.org.br';
  }

  async createInstance(instanceName = this.instanceName) {
    const url = `${this.baseUrl}/instance/create`;

    const headers = {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };

    const body = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      rejectCall: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: true,
      syncFullHistory: false,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao criar instância:', error?.response?.data || error);
      throw new Error('Falha ao criar instância no Evolution API');
    }
  }

  async restartInstance(instanceName = this.instanceName) {
    const url = `${this.baseUrl}/instance/restart/${instanceName}`;

    const headers = {
      apikey: this.apiKey,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.put(url, null, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Erro ao reiniciar instância:',
        error?.response?.data || error,
      );
      throw new Error('Falha ao reiniciar instância');
    }
  }

  getQRCode(instanceName = this.instanceName) {
    return {
      qrUrl: `${this.baseUrl}/instance/qr-code?apikey=${this.apiKey}&instanceName=${instanceName}`,
    };
  }

  async checkConnection(instanceName = this.instanceName) {
    const url = `${this.baseUrl}/instance/check-connection?apikey=${this.apiKey}&instanceName=${instanceName}`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      console.error(
        'Erro ao verificar conexão:',
        error?.response?.data || error,
      );
      return { status: 'DISCONNECTED', error: error?.response?.data || error };
    }
  }

  async sendTextMessage(
    phoneNumber: string,
    message: string,
    options?: {
      delay?: number;
      linkPreview?: boolean;
      mentionsEveryOne?: boolean;
      mentioned?: string[];
      quoted?: {
        key: { id: string };
        message: { conversation: string };
      };
    },
  ) {
    const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;

    const headers = {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };

    const body: any = {
      number: this.formatPhoneNumber(phoneNumber),
      text: message,
      delay: options?.delay ?? 100,
      linkPreview: options?.linkPreview ?? false,
      mentionsEveryOne: options?.mentionsEveryOne ?? false,
    };

    if (options?.mentioned) {
      body.mentioned = options.mentioned;
    }

    if (options?.quoted) {
      body.quoted = options.quoted;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error(
        '❌ Erro ao enviar mensagem Evolution:',
        error?.response?.data || error,
      );
      throw new Error('Falha ao enviar mensagem via Evolution API');
    }
  }

  async sendPurchaseConfirmation(
    buyerName: string,
    phoneNumber: string,
    orderTime: Date,
    products: ProductItem[],
  ) {
    try {
      const message = this.generatePurchaseMessage(
        buyerName,
        orderTime,
        products,
      );

      await this.sendTextMessage(phoneNumber, message);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      if (error.stack) console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async sendInvoiceConfirmation(
    groupFamilyOwnerName: string,
    phoneNumber: string,
    startDate: Date,
    endDate: Date,
    totalAmount: number,
    invoiceId: string,
    paidAmount = 0,
    remaining = null,
    appliedCredit = 0,
    originalAmount = null,
    debitAmount = 0,
  ) {
    try {
      const message = this.generateInvoiceMessage(
        groupFamilyOwnerName,
        startDate,
        endDate,
        totalAmount,
        invoiceId,
        paidAmount,
        remaining,
        appliedCredit,
        originalAmount,
        debitAmount,
      );

      await this.sendTextMessage(phoneNumber, message);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      if (error.stack) console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  private generatePurchaseMessage(
    buyerName: string,
    orderTime: Date,
    products: ProductItem[],
  ): string {
    const productsList = products
      .map((p) => `- ${p.quantity}x ${p.name}`)
      .join('\n');

    return `📢 *Notificação de compra* - ${formatDateTime(orderTime)}
    👤 ${formatName(buyerName)}
    🛍️ Itens:
    ${productsList}`;
  }

  private generateInvoiceMessage(
    groupFamilyOwnerName: string,
    startDate: Date,
    endDate: Date,
    totalAmount: number,
    invoiceId: string,
    paidAmount = 0,
    remaining = null,
    appliedCredit = 0,
    originalAmount = null,
    debitAmount = 0,
  ): string {
    const remainingAmount =
      remaining !== null ? remaining : totalAmount - paidAmount;

    let paymentInfo = '';

    if (originalAmount !== null && (appliedCredit > 0 || debitAmount > 0)) {
      if (paidAmount > 0) {
        paymentInfo = `💵 *Valor original:* R$ ${originalAmount - debitAmount}
    ${debitAmount > 0 && `⚠️ *Débitos anteriores:* R$ ${debitAmount}`}
    ${appliedCredit > 0 && `🔄 *Crédito aplicado:* R$ ${appliedCredit}`}
    💵 *Valor após crédito:* R$ ${totalAmount}
    ✅ *Já pago:* R$ ${paidAmount}
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
      } else {
        paymentInfo = `💵 *Valor original:* R$ ${originalAmount - debitAmount}
    ${debitAmount > 0 && `⚠️ *Débitos anteriores:* R$ ${debitAmount}`}
    ${appliedCredit > 0 && `🔄 *Crédito aplicado:* R$ ${appliedCredit}`}
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
      }
    } else if (paidAmount > 0) {
      paymentInfo = `💵 *Valor total:* R$ ${totalAmount}
    ✅ *Já pago:* R$ ${paidAmount}
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
    } else {
      paymentInfo = `💰 *Valor a pagar:* R$ ${remainingAmount}`;
    }

    return `📄 *Fatura - Cantina RD*
      
    *Olá, ${formatName(groupFamilyOwnerName)}! Sua fatura foi gerada:*
    
    ${paymentInfo}
    
    🗓️ *Período:* ${formatDateShort(startDate)} a ${formatDateShort(endDate)}
    💳 *PIX:* ${this.pixKey}
    📌 Envie o comprovante para processarmos o pagamento.
    🔗 *Veja o detalhamento da fatura no link abaixo:*
    https://admin.cantina-rd.shop/fatura-cliente/${invoiceId}
    
    Grato! 🙌`;
  }

  private formatPhoneNumber(phone: string): string {
    let cleanNumber = phone.replace(/\D/g, '');
    if (!cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }

    return cleanNumber;
  }
}
