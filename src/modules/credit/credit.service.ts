import { Injectable } from '@nestjs/common';
import { CreateCreditDto, UpdateCreditDto } from './dto/create-credit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Credit, CreditDocument } from './entities/credit.entity';

@Injectable()
export class CreditService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<CreditDocument>,
  ) {}

  create(createCreditDto: CreateCreditDto) {
    const credit = new this.creditModel(createCreditDto);
    return credit.save();
  }

  findAll() {
    return this.creditModel.find().exec();
  }

  findOne(id: string) {
    return this.creditModel.findById(id).exec();
  }

  /**
   * Busca todos os créditos disponíveis para um grupo familiar específico
   * @param groupFamilyId ID do grupo familiar
   * @returns Lista de créditos disponíveis
   */
  async findByGroupFamilyId(groupFamilyId: string) {
    return this.creditModel
      .find({ groupFamilyId })
      .sort({ createdAt: -1 })
      .lean();
  }

  update(id: string, updateCreditDto: UpdateCreditDto) {
    return this.creditModel
      .findByIdAndUpdate(id, updateCreditDto, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.creditModel.findByIdAndDelete(id).exec();
  }
}
