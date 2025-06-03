import { Module } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { Credit, CreditSchema } from './entities/credit.entity';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GroupFamily,
  GroupFamilySchema,
} from '../group-family/entities/group-family.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Credit.name, schema: CreditSchema },
      { name: GroupFamily.name, schema: GroupFamilySchema },
    ]),
  ],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
