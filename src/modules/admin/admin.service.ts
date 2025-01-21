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

  update(id: string, updateAdminDto: UpdateAdminDto) {
    return this.adminModel.findByIdAndUpdate(id, updateAdminDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.adminModel.findByIdAndDelete(id);
  }
}
