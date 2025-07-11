import { Controller, Post, Body, Query, Get, Param, Put } from '@nestjs/common';
import { EvolutionWhatsappService } from './evolution-whatsapp.service';

@Controller('evolution-whatsapp')
export class EvolutionWhatsappController {
  constructor(private readonly evolutionService: EvolutionWhatsappService) {}

  @Post('create-instance')
  async createInstance(@Body() body: { instanceName?: string }) {
    const { instanceName } = body;
    return this.evolutionService.createInstance(instanceName || 'cantina-rd');
  }

  @Put('restart-instance/:instanceName')
  async restart(@Param('instanceName') instanceName: string) {
    return this.evolutionService.restartInstance(instanceName);
  }

  @Get('qr-code')
  getQRCode(@Query('instanceName') instanceName = 'cantina-rd') {
    const apiKey = process.env.EVOLUTION_API_KEY;
    const baseUrl = process.env.EVOLUTION_API_URL;

    return {
      qrUrl: `${baseUrl}/instance/qr-code?apikey=${apiKey}&instanceName=${instanceName}`,
    };
  }

  @Get('check-connection')
  checkConnection() {
    const instanceName = 'cantina-rd';
    return this.evolutionService.checkConnection(instanceName);
  }
}
