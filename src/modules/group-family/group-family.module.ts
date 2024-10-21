import { Module } from '@nestjs/common';
import { GroupFamilyService } from './group-family.service';
import { GroupFamilyController } from './group-family.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupFamily, GroupFamilySchema } from './entities/group-family.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupFamily.name, schema: GroupFamilySchema },
    ]),
  ],
  controllers: [GroupFamilyController],
  providers: [GroupFamilyService],
})
export class GroupFamilyModule {}
