import { Module, forwardRef } from '@nestjs/common';
import { GroupFamilyService } from './group-family.service';
import { GroupFamilyController } from './group-family.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupFamily, GroupFamilySchema } from './entities/group-family.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupFamily.name, schema: GroupFamilySchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [GroupFamilyController],
  providers: [GroupFamilyService],
  exports: [GroupFamilyService],
})
export class GroupFamilyModule {}
