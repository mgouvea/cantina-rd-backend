import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { GroupFamilyUser } from 'src/shared/types/user.types';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    const user = new this.userModel({
      ...createUserDto,
      name: createUserDto.name.toLowerCase(),
      createdAt: new Date(),
    });
    return user.save();
  }

  findAll() {
    const users = this.userModel.find().exec();
    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('groupFamily')
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

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
