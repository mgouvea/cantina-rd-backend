import { Injectable, OnModuleInit } from '@nestjs/common';
import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import { ProductItem } from '../orders/dto/create-order.dto';
import { formatDateTime, formatName } from 'src/shared/utils/helpers';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Whatsapp;
  // Número que escaneou o QR code (seu número)
  private readonly ADMIN_PHONE = '61982107187';

  async onModuleInit() {
    this.client = await create({
      session: 'sessionName',
      catchQR: (base64Qrimg, asciiQR) => {
        console.log('QRCode gerado, escaneie com seu WhatsApp:');
        console.log(asciiQR);
      },
      statusFind: (statusSession, session) => {
        console.log(`Status da sessão ${session}: ${statusSession}`);
      },
    });
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

      const cleanBuyerNumber = phoneNumber.replace(/\D/g, '');
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const isAdmin = cleanBuyerNumber === this.ADMIN_PHONE.replace(/\D/g, '');

      if (!this.client || !this.client.isConnected()) {
        await this.reconnect();
      }

      if (isAdmin) {
        const adminMessage = `🧪 *Teste de auto-compra (número do administrador)*\n\n${message}`;
        await this.client.sendText(formattedNumber, adminMessage);
      } else {
        await this.client.sendText(formattedNumber, message);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      if (error.stack) console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  private async reconnect() {
    if (this.client && this.client.isConnected()) {
      return;
    }

    this.client = await create({
      session: 'sessionName',
      catchQR: (base64Qrimg, asciiQR) => {
        console.log('QRCode gerado para reconexão, escaneie com seu WhatsApp:');
        console.log(asciiQR);
      },
      statusFind: (statusSession, session) => {
        console.log(`Status da sessão ${session}: ${statusSession}`);
      },
    });
  }

  private generatePurchaseMessage(
    buyerName: string,
    orderTime: Date,
    products: ProductItem[],
  ): string {
    const productsList = products
      .map((p) => `- ${p.quantity}x ${p.name} - R$${p.price}`)
      .join('\n');

    const total = products.reduce(
      (total, p) => total + p.price * p.quantity,
      0,
    );

    return `🛒 *Cantina RD*
     \n*Olá, ${formatName(
       buyerName,
     )}! Compra realizada no valor de R$ ${total} ${
      total == 1 ? 'real' : 'reais'
    }*\n\n🗓️ Data e Hora: ${formatDateTime(
      orderTime,
    )}\n\nProdutos:\n${productsList}\n\nGrato por sua compra! 🙌`;
  }

  private formatPhoneNumber(phone: string): string {
    let cleanNumber = phone.replace(/\D/g, '');

    // Adiciona o DDI do Brasil se não tiver
    if (!cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }

    const prefixo = cleanNumber.slice(4, 5);

    if (prefixo === '9' && cleanNumber.length === 13) {
      cleanNumber = cleanNumber.slice(0, 4) + cleanNumber.slice(5);
    }

    return `${cleanNumber}@c.us`;
  }
}
