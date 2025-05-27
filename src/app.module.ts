import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ConfigModule } from '@nestjs/config';
import { GroupFamilyModule } from './modules/group-family/group-family.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SubcategoriesModule } from './modules/subcategories/subcategories.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { OrdersVisitorsModule } from './modules/orders-visitors/orders-visitors.module';
import { BucketModule } from './shared/bucket/bucket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldjep.mongodb.net/cantina-rd?retryWrites=true&w=majority&appName=Cluster0`;

        console.log('Tentando conectar ao MongoDB...');
        console.log('URI:', uri.replace(process.env.DB_PASS, '***'));

        return {
          uri,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB conectado com sucesso!');
            });
            connection.on('error', (error) => {
              console.error('❌ Erro na conexão MongoDB:', error.message);
            });
            connection.on('disconnected', () => {
              console.log('🔌 MongoDB desconectado');
            });
            return connection;
          },
          // Configurações de timeout e retry mais adequadas para produção
          serverSelectionTimeoutMS: 10000, // 10 segundos
          socketTimeoutMS: 45000, // 45 segundos
          connectTimeoutMS: 10000, // 10 segundos
          maxPoolSize: 10,
          minPoolSize: 2,
          retryWrites: true,
          retryReads: true,
        };
      },
    }),
    UsersModule,
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    PaymentsModule,
    GroupFamilyModule,
    AuthModule,
    AdminModule,
    SubcategoriesModule,
    InvoiceModule,
    WhatsAppModule,
    VisitorsModule,
    OrdersVisitorsModule,
    BucketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
