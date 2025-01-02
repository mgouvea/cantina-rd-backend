import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    const user = new this.userModel({
      ...createUserDto,
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

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
