import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

import puppeteer from 'puppeteer';

// ✅ Substitui launch para sempre usar --no-sandbox
(puppeteer as any).originalLaunch = puppeteer.launch.bind(puppeteer);
puppeteer.launch = (options = {}) => {
  return (puppeteer as any).originalLaunch({
    ...options,
    args: ['--no-sandbox', '--disable-setuid-sandbox', ...(options.args || [])],
  });
};

async function bootstrap() {
  try {
    const requiredEnvVars = ['PORT', 'DB_USER', 'DB_PASS'];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(
          ', ',
        )}`,
      );
    }

    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'https://cantina-rd.shop',
          'https://admin.cantina-rd.shop',
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origem não permitida pelo CORS: ' + origin));
        }
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    });

    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    app.useGlobalPipes(new ValidationPipe());

    await app.listen(process.env.PORT || 3333);
    console.log(`✅ Aplicação rodando na porta ${process.env.PORT}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error.message);
    process.exit(1);
  }
}

bootstrap();
