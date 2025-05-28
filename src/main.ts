import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

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
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    });

    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    app.useGlobalPipes(new ValidationPipe());

    await app.listen(process.env.PORT);
    console.log(`✅ Aplicação rodando na porta ${process.env.PORT}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error.message);
    process.exit(1);
  }
}

bootstrap();
