import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminModule } from '../admin/admin.module';
import { GroupFamilyModule } from '../group-family/group-family.module';
import { BucketModule } from 'src/shared/bucket/bucket.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AdminModule,
    forwardRef(() => GroupFamilyModule),
    BucketModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
