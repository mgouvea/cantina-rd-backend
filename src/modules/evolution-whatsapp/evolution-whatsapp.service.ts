import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EvolutionWhatsappService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.EVOLUTION_API_KEY;
    this.baseUrl = process.env.EVOLUTION_API_URL;
  }

  async createInstance(instanceName = 'cantina-rd') {
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

  async restartInstance(instanceName = 'cantina-rd') {
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

  getQRCode(instanceName = 'cantina-rd') {
    return {
      qrUrl: `${this.baseUrl}/instance/qr-code?apikey=${this.apiKey}&instanceName=${instanceName}`,
    };
  }

  async checkConnection(instanceName = 'cantina-rd') {
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
}
