// src/whatsapp/whatsapp.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
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
}
