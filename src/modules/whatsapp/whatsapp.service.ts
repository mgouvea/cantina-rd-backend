import { Injectable, OnModuleInit } from '@nestjs/common';
import { create, Whatsapp, defaultLogger } from '@wppconnect-team/wppconnect';
import * as fs from 'fs';
import * as path from 'path';
import { ProductItem } from '../orders/dto/create-order.dto';
import {
  formatDateShort,
  formatDateTime,
  formatName,
} from 'src/shared/utils/helpers';
// Tipos utilizados nos parâmetros dos métodos

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Whatsapp;
  // Número que escaneou o QR code (seu número)
  private qrCode: string = null;
  private qrCodeBase64: string = null;
  private readonly SESSION_NAME = 'sessionName';
  private readonly SESSION_PATH = './tokens';

  async onModuleInit() {
    try {
      // Configurar logger para ser mais verboso durante a inicialização
      defaultLogger.level = 'silly';

      this.client = await create({
        session: this.SESSION_NAME,
        catchQR: (base64Qrimg, asciiQR) => {
          console.log('QRCode gerado, escaneie com seu WhatsApp:');
          this.qrCode = asciiQR;
          this.qrCodeBase64 = base64Qrimg;
        },
        statusFind: (statusSession, session) => {
          console.log(`Status da sessão ${session}: ${statusSession}`);
          // Limpar o QR code quando a sessão estiver conectada
          if (statusSession === 'inChat' || statusSession === 'isLogged') {
            this.qrCode = null;
            this.qrCodeBase64 = null;
          }
        },
        folderNameToken: this.SESSION_PATH,
        createPathFileToken: true,
        headless: true,
        useChrome: false,
        debug: false,
        puppeteerOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      console.log('WhatsApp service inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp service:', error);
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

      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      if (!this.client || !this.client.isConnected()) {
        await this.reconnect();
      }

      await this.client.sendText(formattedNumber, message);
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
      );

      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      if (!this.client || !this.client.isConnected()) {
        await this.reconnect();
      }

      await this.client.sendText(formattedNumber, message);
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
        this.qrCode = asciiQR;
        this.qrCodeBase64 = base64Qrimg;
      },
      statusFind: (statusSession, session) => {
        console.log(`Status da sessão ${session}: ${statusSession}`);
        // Limpar o QR code quando a sessão estiver conectada
        if (statusSession === 'inChat' || statusSession === 'isLogged') {
          this.qrCode = null;
          this.qrCodeBase64 = null;
        }
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
  ): string {
    // Se o valor restante não foi fornecido, calculamos como totalAmount - paidAmount
    const remainingAmount =
      remaining !== null ? remaining : totalAmount - paidAmount;

    // Preparar mensagem sobre pagamento parcial e crédito aplicado, se aplicável
    let paymentInfo = '';
    // Se temos um valor original diferente do total, significa que foi aplicado crédito
    if (originalAmount !== null && appliedCredit > 0) {
      if (paidAmount > 0) {
        paymentInfo = `
    💵 *Valor original:* R$ ${originalAmount}
    🔄 *Crédito aplicado:* R$ ${appliedCredit}
    💵 *Valor após crédito:* R$ ${totalAmount}
    ✅ *Já pago:* R$ ${paidAmount}
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
      } else {
        paymentInfo = `
    💵 *Valor original:* R$ ${originalAmount}
    🔄 *Crédito aplicado:* R$ ${appliedCredit}
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
      }
    } else if (paidAmount > 0) {
      paymentInfo = `
    💵 *Valor total:* R$ ${totalAmount}
    ✅ *Já pago:* R$ ${paidAmount}
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
    } else {
      paymentInfo = `
    💰 *Valor a pagar:* R$ ${remainingAmount}`;
    }

    return `📄 *Fatura - Cantina RD*

    *Olá, ${formatName(groupFamilyOwnerName)}! Sua fatura foi gerada:*
${paymentInfo}
    🗓️ *Período:* ${formatDateShort(startDate)} a ${formatDateShort(endDate)}
    💳 *PIX:* tes.realezadivina@udv.org.br
    📌 Envie o comprovante para processarmos o pagamento.

    🔗 *Veja o detalhamento da fatura no link abaixo:*

https://admin.cantina-rd.shop/fatura-cliente/${invoiceId}

    Grato! 🙌`;
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

  /**
   * Retorna o QR code atual em formato base64 para exibição no frontend
   * @returns O QR code em formato base64 ou null se não estiver disponível
   */
  getQrCode() {
    return {
      qrCode: this.qrCode,
      qrCodeBase64: this.qrCodeBase64,
      isConnected: this.client?.isConnected() || false,
    };
  }

  /**
   * Apaga os arquivos de sessão para forçar a geração de um novo QR code
   * @private
   */
  private async deleteSessionFiles() {
    try {
      const sessionFolder = path.resolve(this.SESSION_PATH);
      const sessionFile = path.join(
        sessionFolder,
        `${this.SESSION_NAME}.data.json`,
      );
      const sessionWAFile = path.join(sessionFolder, `WA-${this.SESSION_NAME}`);

      // Verificar se a pasta de sessão existe
      if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
        console.log(`Pasta de sessão criada: ${sessionFolder}`);
        return;
      }

      // Apagar arquivo de sessão principal se existir
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
        console.log(`Arquivo de sessão apagado: ${sessionFile}`);
      }

      // Apagar pasta WA se existir
      if (fs.existsSync(sessionWAFile)) {
        const files = fs.readdirSync(sessionWAFile);
        for (const file of files) {
          fs.unlinkSync(path.join(sessionWAFile, file));
        }
        fs.rmdirSync(sessionWAFile);
        console.log(`Pasta WA apagada: ${sessionWAFile}`);
      }

      console.log('Arquivos de sessão apagados com sucesso');
    } catch (error) {
      console.error('Erro ao apagar arquivos de sessão:', error);
    }
  }

  /**
   * Força a geração de um novo QR code desconectando a sessão atual
   * @returns Promessa que resolve com o novo QR code
   */
  async generateNewQrCode() {
    try {
      console.log('Iniciando geração de novo QR code...');

      // Limpar o QR code atual
      this.qrCode = null;
      this.qrCodeBase64 = null;

      // Desconectar a sessão atual se estiver conectada
      if (this.client && this.client.isConnected()) {
        try {
          console.log('Fechando cliente WhatsApp existente...');
          await this.client.close();
          this.client = null;
          console.log('Cliente WhatsApp fechado com sucesso');
        } catch (closeError) {
          console.error('Erro ao fechar cliente:', closeError);
          // Continuar mesmo com erro no fechamento
          this.client = null;
        }
      }

      // Apagar arquivos de sessão para forçar novo QR code
      console.log('Apagando arquivos de sessão...');
      await this.deleteSessionFiles();

      // Criar uma nova sessão e aguardar o QR code ser gerado
      console.log('Criando nova sessão...');
      return await new Promise((resolve, reject) => {
        let isResolved = false;

        // Timeout para evitar espera infinita
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.error('Timeout ao aguardar geração do QR code');
            reject({ success: false, message: 'Timeout ao gerar QR code' });
          }
        }, 30000); // 30 segundos de timeout

        try {
          // Configurar logger para ser mais verboso durante a geração do QR code
          defaultLogger.level = 'silly';

          create({
            session: this.SESSION_NAME,
            catchQR: (base64Qrimg, asciiQR) => {
              console.log('QRCode gerado com sucesso!');

              // Armazenar o QR code
              this.qrCode = asciiQR;
              this.qrCodeBase64 = base64Qrimg;

              // Limpar o timeout e resolver com o QR code
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: true,
                  qrCode: asciiQR,
                  qrCodeBase64: base64Qrimg,
                  isConnected: false,
                });
              }
            },
            statusFind: (statusSession, session) => {
              console.log(`Status da sessão ${session}: ${statusSession}`);

              // Se a sessão conectar antes do QR code ser escaneado, resolver com erro
              if (
                (statusSession === 'inChat' || statusSession === 'isLogged') &&
                !isResolved
              ) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: false,
                  message: 'Sessão já está conectada',
                  isConnected: true,
                });

                // Limpar o QR code quando a sessão estiver conectada
                this.qrCode = null;
                this.qrCodeBase64 = null;
              }
            },
            folderNameToken: this.SESSION_PATH,
            createPathFileToken: true,
            headless: true,
            useChrome: false,
            debug: true,
          })
            .then((client) => {
              console.log('Cliente WhatsApp criado com sucesso');
              this.client = client;
            })
            .catch((err) => {
              console.error('Erro ao criar cliente WhatsApp:', err);
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                reject({
                  success: false,
                  message: 'Erro ao criar sessão',
                  error: err.message,
                });
              }
            });
        } catch (createError) {
          console.error('Erro ao iniciar sessão:', createError);
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            reject({
              success: false,
              message: 'Erro ao iniciar sessão',
              error: createError.message,
            });
          }
        }
      });
    } catch (error) {
      console.error('Erro ao gerar novo QR code:', error);
      return {
        success: false,
        message: 'Erro ao gerar novo QR code',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }
}
