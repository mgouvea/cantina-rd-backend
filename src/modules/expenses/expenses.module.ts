import { BucketModule } from 'src/shared/bucket/bucket.module';
import { Expense, ExpenseSchema } from './entities/expense.entity';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { forwardRef } from '@nestjs/common';
import { GroupFamilyModule } from '../group-family/group-family.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    forwardRef(() => GroupFamilyModule),
    BucketModule,
    UsersModule,
    CreditModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
