import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';
import { ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { sanitizedName } from 'src/shared/utils/helpers';
import { Expense, ExpenseDocument } from './entities/expense.entity';
import { BucketService } from 'src/shared/bucket/bucket.service';
import { UsersService } from '../users/users.service';
import { CreditService } from '../credit/credit.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    private bucketService: BucketService,
    private usersService: UsersService,
    private creditService: CreditService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const publicId = `users/${sanitizedName(
      `${createExpenseDto.userId}-${createExpenseDto.expenseDate}-${createExpenseDto.expenseValue}`,
    )}`;

    const existingExpense = await this.expenseModel.findOne({
      publicIdImage: publicId,
    });

    if (existingExpense) {
      throw new ConflictException('Essa despesa já foi cadastrada.');
    }

    const imageUrl = await this.bucketService.uploadBase64Image(
      createExpenseDto.urlImage,
      'expenses',
      sanitizedName(
        `${createExpenseDto.userId}-${createExpenseDto.expenseDate}-${createExpenseDto.expenseValue}`,
      ),
    );

    const groupFamilyId = await this.usersService.findGroupFamily(
      createExpenseDto.userId,
    );

    if (createExpenseDto.expenseType === 'refund') {
      await this.creditService.create({
        creditedAmount: createExpenseDto.expenseValue,
        amount: createExpenseDto.expenseValue,
        groupFamilyId: groupFamilyId.groupFamily,
        archivedCredit: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const expense = new this.expenseModel({
      ...createExpenseDto,
      urlImage: imageUrl,
      publicIdImage: publicId,
      groupFamilyId: groupFamilyId.groupFamily,
    });

    return expense.save();
  }

  findAll() {
    return this.expenseModel.find();
  }

  findOne(id: string) {
    return this.expenseModel.findById(id);
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.expenseModel.findById(id);

    if (!expense) {
      throw new HttpException('Despesa não encontrada', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...updateExpenseDto };

    if (
      updateExpenseDto.urlImage &&
      updateExpenseDto.urlImage.startsWith('data:image/')
    ) {
      // If there's an existing image, delete it first
      if (expense.publicIdImage) {
        await this.bucketService.deleteImageByName(expense.publicIdImage);
      }

      // Generate a sanitized name for the image
      const nameForImage = sanitizedName(
        `${expense.userId}-${
          updateExpenseDto.expenseDate || expense.expenseDate
        }-${updateExpenseDto.expenseValue || expense.expenseValue}`,
      );

      // Upload the new image
      const imageUrl = await this.bucketService.uploadBase64Image(
        updateExpenseDto.urlImage,
        'expenses',
        nameForImage,
      );

      // Update the image URL and public ID
      updateData.urlImage = imageUrl;
      updateData.publicIdImage = `expenses/${nameForImage}`;
    }

    return this.expenseModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  async remove(id: string) {
    const expense = await this.expenseModel.findById(id);

    if (!expense) {
      throw new HttpException('Despesa não encontrada', HttpStatus.NOT_FOUND);
    }

    await this.bucketService.deleteImageByName(expense.publicIdImage);
    return this.expenseModel.findByIdAndDelete(id);
  }
}
