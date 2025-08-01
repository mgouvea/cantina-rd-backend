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

  async create(createCreditDto: CreateCreditDto) {
    // Check if there's an existing credit with amount > 0 for this group family
    const existingCredit = await this.creditModel
      .findOne({
        groupFamilyId: createCreditDto.groupFamilyId,
        amount: { $gt: 0 },
        archivedCredit: false,
      })
      .exec();

    if (existingCredit) {
      // If there's an existing credit with amount > 0, archive it and create a new one with combined amount
      const combinedAmount = existingCredit.amount + createCreditDto.amount;
      // Archive the existing credit
      await this.creditModel
        .findByIdAndUpdate(existingCredit._id, {
          amount: 0,
          archivedCredit: true,
          updatedAt: new Date(),
        })
        .exec();

      // Create a new credit with combined amount
      const newCredit = new this.creditModel({
        ...createCreditDto,
        amount: combinedAmount,
        creditedAmount: combinedAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newCredit.save();
    } else {
      // If no existing credit or existing credit has amount = 0, create a new one
      const credit = new this.creditModel({
        ...createCreditDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return credit.save();
    }
  }

  async findAllActiveCredits() {
    const credits = await this.creditModel
      .find({ archivedCredit: false })
      .lean();

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
      .find({ groupFamilyId, archivedCredit: false })
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
