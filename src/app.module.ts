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
import { VisitorsModule } from './modules/stack/visitors/visitors.module';
import { BucketModule } from './shared/bucket/bucket.module';
import { CreditModule } from './modules/credit/credit.module';
import { DebitModule } from './modules/debit/debit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { VisitorsPaymentModule } from './modules/stack/visitors-payment/visitors-payment.module';
import { VisitorsInvoiceModule } from './modules/stack/visitors-invoice/visitors-invoice.module';
import { OrdersVisitorsModule } from './modules/stack/orders-visitors/orders-visitors.module';
import { EvolutionWhatsappModule } from './modules/evolution-whatsapp/evolution-whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        let uri: string;

        if (process.env.NODE_ENV === 'production') {
          uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/`;
          console.log('🚀 Conectando ao MongoDB em ambiente de produção (VPS)');
        } else {
          uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.twkwaw3.mongodb.net/cantina-rd?retryWrites=true&w=majority`;
          console.log(
            '🔧 Conectando ao MongoDB em ambiente de desenvolvimento',
          );
        }

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
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
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
    CreditModule,
    DebitModule,
    DashboardModule,
    VisitorsPaymentModule,
    VisitorsInvoiceModule,
    EvolutionWhatsappModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
