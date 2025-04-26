import { Controller, Post, Body } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send')
  async sendWhatsAppMessage(@Body() body: { phone: string; message: string }) {
    const { phone, message } = body;
    return this.whatsappService.sendMessage(phone, message);
  }

  @Post('purchase-notification')
  async notifyPurchase(
    @Body() body: { buyerId: string; phone: string; total: number },
  ) {
    // Aqui você pode buscar o nome real do comprador pelo buyerId
    const buyerName = await this.getBuyerName(body.buyerId); // simulado
    return this.whatsappService.sendPurchaseNotification(
      body.phone,
      buyerName,
      body.total,
    );
  }

  // Simulação simples de lookup (substitua com sua lógica real)
  private async getBuyerName(buyerId: string): Promise<string> {
    // Exemplo fixo, ideal é buscar no banco de dados
    if (buyerId === '1') return 'João';
    if (buyerId === '2') return 'Maria';
    return 'Cliente';
  }
}
