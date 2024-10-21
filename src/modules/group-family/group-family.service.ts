import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateGroupFamilyDto,
  UpdateGroupFamilyDto,
} from './dto/group-family.dto';
import {
  GroupFamily,
  GroupFamilyDocument,
} from './entities/group-family.entity';

@Injectable()
export class GroupFamilyService {
  constructor(
    @InjectModel(GroupFamily.name)
    private groupFamilyModel: Model<GroupFamilyDocument>,
  ) {}

  create(createGroupFamilyDto: CreateGroupFamilyDto) {
    return this.groupFamilyModel.create(createGroupFamilyDto);
  }

  findAll() {
    return this.groupFamilyModel.find();
  }

  findOne(id: string) {
    return this.groupFamilyModel.findById(id);
  }

  update(id: string, updateGroupFamilyDto: UpdateGroupFamilyDto) {
    return this.groupFamilyModel.findByIdAndUpdate(id, updateGroupFamilyDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.groupFamilyModel.findByIdAndDelete(id);
  }
}
