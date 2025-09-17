import { BadRequestException, Injectable } from '@nestjs/common';
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
    // Normalize and validate incoming amount as number
    const incomingAmount = Number(createCreditDto.amount);
    if (Number.isNaN(incomingAmount)) {
      throw new BadRequestException('Invalid amount');
    }

    // Find the most recent active (non-archived) credit for this group family
    // We don't filter by amount here because legacy records may have amount stored as string
    const existingCredit = await this.creditModel
      .findOne({
        groupFamilyId: createCreditDto.groupFamilyId,
        archivedCredit: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    const existingAmount = existingCredit ? Number(existingCredit.amount) : 0;

    if (existingCredit && existingAmount > 0) {
      // Combine with existing active credit
      const combinedAmount =
        Math.round((existingAmount + incomingAmount) * 100) / 100;

      // Archive the existing credit
      await this.creditModel
        .findByIdAndUpdate(existingCredit._id, {
          amount: 0,
          archivedCredit: true,
          updatedAt: new Date(),
        })
        .exec();

      // Create a new credit with the combined amount
      const newCredit = new this.creditModel({
        groupFamilyId: createCreditDto.groupFamilyId,
        amount: combinedAmount,
        creditedAmount: combinedAmount,
        archivedCredit: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newCredit.save();
    } else {
      // Create a fresh credit using the normalized incoming amount
      const credit = new this.creditModel({
        groupFamilyId: createCreditDto.groupFamilyId,
        amount: Math.round(incomingAmount * 100) / 100,
        creditedAmount: Math.round(incomingAmount * 100) / 100,
        archivedCredit: false,
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

  async findAllArchiveCredits() {
    const credits = await this.creditModel
      .find({ archivedCredit: true })
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
