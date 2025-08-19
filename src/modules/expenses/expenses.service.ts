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
import { GroupFamilyService } from '../group-family/group-family.service';
import { UpdateCreditDto } from '../credit/dto/create-credit.dto';
import { ExpenseTypeEnum } from './dto/expenseEnum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    private bucketService: BucketService,
    private usersService: UsersService,
    private creditService: CreditService,
    private groupFamilyService: GroupFamilyService,
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

    if (createExpenseDto.expenseType === ExpenseTypeEnum.CANTINE_CREDIT) {
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

  async findAll() {
    const expenses = await this.expenseModel.find();

    const expensesWithDetails = await Promise.all(
      expenses.map(async (expense) => {
        // Get user information
        const user = await this.usersService.findUserNameAndPhoneById(
          expense.userId,
        );
        const userName = user ? user.name : '';

        // Get group family name
        const groupFamilyName =
          await this.groupFamilyService.findGroupFamilyName(
            expense.groupFamilyId,
          );

        return {
          ...expense.toObject(),
          userName,
          groupFamilyName,
        };
      }),
    );

    return expensesWithDetails;
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

    // Handle image update if there's a new image
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

    // Handle credit update if this is a refund expense and the value is being updated
    if (
      expense.expenseType === ExpenseTypeEnum.CANTINE_CREDIT &&
      updateExpenseDto.expenseValue !== undefined &&
      updateExpenseDto.expenseValue !== expense.expenseValue
    ) {
      // Find credits created around the same time as the expense for the same group family
      const credits = await this.creditService.findByGroupFamilyId(
        expense.groupFamilyId,
      );

      // Look for a credit that matches the expense value and was created around the same time
      const matchingCredit = credits.find(
        (credit) =>
          credit.creditedAmount === expense.expenseValue &&
          // Check if the credit was created around the same time as the expense
          Math.abs(
            new Date(credit.createdAt).getTime() -
              new Date(expense.createdAt).getTime(),
          ) < 60000, // within 1 minute
      );

      if (matchingCredit) {
        // Create update data for the credit
        const creditUpdateData: UpdateCreditDto = {
          creditedAmount: updateExpenseDto.expenseValue,
          updatedAt: new Date(),
        };

        // Check if the credit has been used (amount !== creditedAmount)
        const creditHasBeenUsed =
          matchingCredit.amount !== matchingCredit.creditedAmount;

        if (!creditHasBeenUsed) {
          // If the credit hasn't been used, update both creditedAmount and amount
          creditUpdateData.amount = updateExpenseDto.expenseValue;
        } else {
          // If the credit has been used, adjust the amount by the difference
          // Calculate how much of the credit has been used
          const usedAmount =
            matchingCredit.creditedAmount - matchingCredit.amount;

          // New amount = new creditedAmount - usedAmount
          // This ensures we maintain the same level of usage
          creditUpdateData.amount = updateExpenseDto.expenseValue - usedAmount;

          // Ensure amount doesn't go negative
          if (creditUpdateData.amount < 0) {
            creditUpdateData.amount = 0;
          }
        }

        // Update the credit
        await this.creditService.update(
          matchingCredit._id.toString(),
          creditUpdateData,
        );
      }
    }

    // Update the expense
    return this.expenseModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  async remove(id: string) {
    const expense = await this.expenseModel.findById(id);

    if (!expense) {
      throw new HttpException('Despesa não encontrada', HttpStatus.NOT_FOUND);
    }

    // Check if the expense is of type 'refund'
    if (expense.expenseType === 'refund') {
      // Find credits created around the same time as the expense for the same group family
      const credits = await this.creditService.findByGroupFamilyId(
        expense.groupFamilyId,
      );

      // Look for a credit that matches the expense value and was created around the same time
      const matchingCredit = credits.find(
        (credit) =>
          credit.creditedAmount === expense.expenseValue &&
          // Check if the credit hasn't been used (amount equals creditedAmount)
          credit.amount === credit.creditedAmount &&
          // Check if the credit was created around the same time as the expense
          Math.abs(
            new Date(credit.createdAt).getTime() -
              new Date(expense.createdAt).getTime(),
          ) < 60000, // within 1 minute
      );

      if (matchingCredit) {
        // Delete the credit if it hasn't been used
        await this.creditService.remove(matchingCredit._id.toString());
      }
    }

    await this.bucketService.deleteImageByName(expense.publicIdImage);
    return this.expenseModel.findByIdAndDelete(id);
  }
}
