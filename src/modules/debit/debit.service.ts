import { Injectable } from '@nestjs/common';
import { CreateDebitDto, UpdateDebitDto } from './dto/create-debit.dto';
import { Debit, DebitDocument } from './entities/debit.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  GroupFamily,
  GroupFamilyDocument,
} from '../group-family/entities/group-family.entity';

@Injectable()
export class DebitService {
  constructor(
    @InjectModel(Debit.name) private debitModel: Model<DebitDocument>,
    @InjectModel(GroupFamily.name)
    private groupFamilyModel: Model<GroupFamilyDocument>,
  ) {}

  create(createDebitDto: CreateDebitDto) {
    const debit = new this.debitModel(createDebitDto);
    return debit.save();
  }

  findAll() {
    return this.debitModel.find().lean();
  }

  findOne(id: string) {
    return this.debitModel.findById(id).lean();
  }

  findByGroupFamilyId(groupFamilyId: string) {
    return this.debitModel.find({ groupFamilyId }).lean();
  }

  update(id: string, updateDebitDto: UpdateDebitDto) {
    return this.debitModel
      .findByIdAndUpdate(id, updateDebitDto, { new: true })
      .lean();
  }

  remove(id: string) {
    return this.debitModel.findByIdAndDelete(id).lean();
  }
}
