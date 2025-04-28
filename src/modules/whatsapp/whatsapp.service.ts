// src/whatsapp/whatsapp.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import { ProductItem } from '../orders/dto/create-order.dto';
import { formatDateTime, formatName } from 'src/shared/utils/helpers';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Whatsapp;

  async onModuleInit() {
    this.client = await create({
      session: 'sessionName', // Nome da sessão que será criada
      catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
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
    const message = this.generatePurchaseMessage(
      buyerName,
      orderTime,
      products,
    );
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    await this.client.sendText(formattedNumber, message);
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
    // WPPConnect precisa do formato internacional + "c.us" no final
    // Ex: 5511999999999@c.us
    return `55${phone}@c.us`;
  }
}
