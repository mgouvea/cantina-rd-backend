import { Module } from '@nestjs/common';
import { DebitService } from './debit.service';
import { DebitController } from './debit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Debit, DebitSchema } from './entities/debit.entity';
import {
  GroupFamily,
  GroupFamilySchema,
} from '../group-family/entities/group-family.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Debit.name, schema: DebitSchema },
      { name: GroupFamily.name, schema: GroupFamilySchema },
    ]),
  ],
  controllers: [DebitController],
  providers: [DebitService],
  exports: [DebitService],
})
export class DebitModule {}
