import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly wppBaseUrl = 'http://localhost:21465/api'; // ou o IP/URL do seu servidor

  async sendMessage(phone: string, message: string) {
    try {
      const response = await axios.post(`${this.wppBaseUrl}/send-message`, {
        session: 'default', // nome da sessão criada no WPPConnect
        phone,
        message,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem via WhatsApp:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendPurchaseNotification(
    phone: string,
    buyerName: string,
    total: number,
  ) {
    const message = `🛒 Oi ${buyerName}, sua compra na cantina foi registrada no valor de R$ ${total.toFixed(
      2,
    )}. Grato!`;
    return this.sendMessage(phone, message);
  }
}
