import { Injectable } from '@nestjs/common';
import { CreateAdminDto, UpdateAdminDto } from './dto/create-admin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,
  ) {}

  create(createAdminDto: CreateAdminDto) {
    return this.adminModel.create({
      ...createAdminDto,
      name: createAdminDto.name.toLowerCase(),
      email: createAdminDto.email.toLowerCase(),
      createdAt: new Date(),
    });
  }

  findAll() {
    return this.adminModel.find();
  }

  async findByUserId(id: string) {
    return this.adminModel.find({ idUser: id });
  }

  update(id: string, updateAdminDto: UpdateAdminDto) {
    return this.adminModel.findByIdAndUpdate(id, updateAdminDto, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.adminModel.findByIdAndDelete(id);
  }

  async removeByUserId(id: string) {
    return this.adminModel.findOneAndDelete({ idUser: id });
  }
}
