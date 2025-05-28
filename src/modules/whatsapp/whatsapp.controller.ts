// src/whatsapp/whatsapp.controller.ts

import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ProductItem } from '../orders/dto/create-order.dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-purchase')
  async sendPurchaseMessage(
    @Body()
    body: {
      buyerName: string;
      phoneNumber: string;
      orderTime: Date;
      products: ProductItem[];
    },
  ) {
    const { buyerName, phoneNumber, orderTime, products } = body;
    await this.whatsappService.sendPurchaseConfirmation(
      buyerName,
      phoneNumber,
      orderTime,
      products,
    );
    return { message: 'Mensagem enviada com sucesso!' };
  }

  /**
   * Retorna o QR code atual para ser exibido no frontend
   * @returns Objeto contendo o QR code em formato ASCII e base64
   */
  @Get('qrcode')
  getQrCode() {
    return this.whatsappService.getQrCode();
  }

  /**
   * Força a geração de um novo QR code e retorna o QR code gerado
   * @returns O novo QR code gerado
   */
  @Post('generate-qrcode')
  async generateNewQrCode() {
    try {
      // Desconecta a sessão atual, gera um novo QR code e o retorna imediatamente
      const result = await this.whatsappService.generateNewQrCode();
      return result;
    } catch (error) {
      console.error('Erro ao gerar QR code no controller:', error);
      return {
        success: false,
        message: 'Erro ao gerar QR code',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }
}
