import { Injectable } from '@nestjs/common';
import { CreateCreditDto, UpdateCreditDto } from './dto/create-credit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Credit, CreditDocument } from './entities/credit.entity';
import {
  GroupFamily,
  GroupFamilyDocument,
} from '../group-family/entities/group-family.entity';

@Injectable()
export class CreditService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<CreditDocument>,
    @InjectModel(GroupFamily.name)
    private groupFamilyModel: Model<GroupFamilyDocument>,
  ) {}

  create(createCreditDto: CreateCreditDto) {
    const credit = new this.creditModel(createCreditDto);
    return credit.save();
  }

  async findAll() {
    const credits = await this.creditModel.find().lean();

    // Adicionar o nome do grupo familiar para cada crédito
    const creditsWithGroupName = await Promise.all(
      credits.map(async (credit) => {
        const groupFamily = await this.groupFamilyModel
          .findById(credit.groupFamilyId)
          .lean();

        return {
          ...credit,
          groupFamilyName: groupFamily
            ? groupFamily.name
            : 'Grupo não encontrado',
        };
      }),
    );

    return creditsWithGroupName;
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
