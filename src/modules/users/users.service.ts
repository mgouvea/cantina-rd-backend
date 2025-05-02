import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { GroupFamilyUser } from 'src/shared/types/user.types';
import { AdminService } from '../admin/admin.service';
import { GroupFamilyService } from '../group-family/group-family.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private adminService: AdminService,
    @Inject(forwardRef(() => GroupFamilyService))
    private groupFamilyService: GroupFamilyService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = new this.userModel({
      ...createUserDto,
      name: createUserDto.name.toLowerCase(),
      createdAt: new Date(),
    });
    return user.save();
  }

  async findAll() {
    const users = await this.userModel.find();

    const usersWithGroupFamily = await Promise.all(
      users.map(async (user) => {
        const groupFamilyName =
          await this.groupFamilyService.findGroupFamilyName(
            user.groupFamily ? user.groupFamily.toString() : '',
          );

        return {
          ...user.toObject(),
          groupFamilyName,
        };
      }),
    );

    return usersWithGroupFamily;
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('groupFamily')
      .exec();

    return user;
  }

  async findUserNameAndPhoneById(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('name telephone')
      .exec();
    return user;
  }

  async findGroupFamily(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('groupFamily')
      .exec();
    return user;
  }

  async updateGroupFamily(id: string, groupFamilyUsers: GroupFamilyUser[]) {
    if (groupFamilyUsers.length === 0) {
      throw new HttpException('No group family users', HttpStatus.BAD_REQUEST);
    }

    groupFamilyUsers.forEach(async (user) => {
      if (!user.name || !user.userId) {
        throw new HttpException(
          'Invalid group family user',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userModel.findByIdAndUpdate(user.userId, { groupFamily: id });
    });

    return `${
      groupFamilyUsers.length > 1
        ? 'Usuários atualizados'
        : 'Usuário atualizado'
    } com sucesso`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
  }

  async remove(id: string) {
    const admin = await this.adminService.findByUserId(id);

    if (admin && admin.length > 0) {
      await this.adminService.remove(admin[0]._id.toString());
    }

    await this.groupFamilyService.removeMembersFromGroupFamily(id);

    return this.userModel.findByIdAndDelete(id);
  }
}
