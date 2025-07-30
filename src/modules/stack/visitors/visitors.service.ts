// visitors.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visitor, VisitorDocument } from './entities/visitor.entity';
import { CreateVisitorDto, UpdateVisitorDto } from './dto/create-visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectModel(Visitor.name) private visitorModel: Model<VisitorDocument>,
  ) {}

  async create(createVisitorDto: CreateVisitorDto) {
    const visitorExists = await this.visitorModel.findOne({
      name: createVisitorDto.name.toLowerCase(),
      telephone: createVisitorDto.telephone,
    });

    if (visitorExists) {
      visitorExists.visitCount++;
      visitorExists.lastVisit = new Date();
      return visitorExists.save();
    }

    const createdVisitor = new this.visitorModel({
      ...createVisitorDto,
      name: createVisitorDto.name.toLowerCase(),
      visitCount: 1,
      lastVisit: new Date(),
    });
    return createdVisitor.save();
  }

  async findAll(search?: string) {
    if (search && search.length >= 3) {
      return this.visitorModel.find({
        name: { $regex: search, $options: 'i' },
      });
    }

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 30);
    return this.visitorModel.find({
      $or: [
        { lastVisit: { $gte: dateThreshold } },
        { visitCount: { $gte: 3 } },
      ],
    });
  }

  async findAllWithoutDateFilter() {
    return this.visitorModel.find().sort({ name: 1 });
  }

  async findOne(id: string) {
    return this.visitorModel.findById(id);
  }

  async findVisitorNameAndPhoneById(visitorId: string) {
    const visitor = await this.visitorModel
      .findById(visitorId)
      .select('name telephone churchCore')
      .exec();
    return visitor;
  }

  async update(id: string, updateVisitorDto: UpdateVisitorDto) {
    return this.visitorModel.findByIdAndUpdate(id, updateVisitorDto, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.visitorModel.findByIdAndDelete(id);
  }

  async cleanup() {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - 6);

    const result = await this.visitorModel.deleteMany({
      visitCount: { $lt: 3 },
      lastVisit: { $lt: thresholdDate },
    });

    return {
      message: 'Cleanup completed',
      deletedCount: result.deletedCount,
    };
  }
}
