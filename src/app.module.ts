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
      useFactory: () => ({
        uri: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldjep.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
      }),
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
