import {
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { GroupFamilyUser } from 'src/shared/types/user.types';
import { AdminService } from '../admin/admin.service';
import { GroupFamilyService } from '../group-family/group-family.service';
import { sanitizedName } from 'src/shared/utils/helpers';
import { BucketService } from 'src/shared/bucket/bucket.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private adminService: AdminService,
    @Inject(forwardRef(() => GroupFamilyService))
    private groupFamilyService: GroupFamilyService,
    private bucketService: BucketService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const publicId = `users/${sanitizedName(createUserDto.name)}`;

    const existingUser = await this.userModel.findOne({
      publicIdImage: publicId,
    });

    if (existingUser) {
      throw new ConflictException(
        'Já existe um usuário com esse nome (imagem).',
      );
    }

    const imageUrl = await this.bucketService.uploadBase64Image(
      createUserDto.urlImage,
      'users',
      sanitizedName(createUserDto.name),
    );

    const user = new this.userModel({
      ...createUserDto,
      name: createUserDto.name.toLowerCase(),
      urlImage: imageUrl,
      publicIdImage: publicId,
    });
    return user.save();
  }

  async findAll() {
    const users = await this.userModel.find().sort({ name: 1 });

    const usersWithGroupFamily = await Promise.all(
      users.map(async (user) => {
        const groupFamilyName =
          await this.groupFamilyService.findGroupFamilyName(
            user.groupFamily ? user.groupFamily.toString() : '',
          );

        return {
          ...user.toObject(),
          groupFamilyName,
        };
      }),
    );

    return usersWithGroupFamily;
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('groupFamily')
      .exec();

    return user;
  }

  async findUserNameAndPhoneById(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('name telephone')
      .exec();
    return user;
  }

  async findGroupFamily(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('groupFamily')
      .exec();
    return user;
  }

  async updateGroupFamily(id: string, groupFamilyUsers: GroupFamilyUser[]) {
    if (groupFamilyUsers.length === 0) {
      throw new HttpException('No group family users', HttpStatus.BAD_REQUEST);
    }

    groupFamilyUsers.forEach(async (user) => {
      if (!user.name || !user.userId) {
        throw new HttpException(
          'Invalid group family user',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userModel.findByIdAndUpdate(user.userId, { groupFamily: id });
    });

    return `${
      groupFamilyUsers.length > 1
        ? 'Usuários atualizados'
        : 'Usuário atualizado'
    } com sucesso`;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...updateUserDto };

    if (
      updateUserDto.urlImage &&
      updateUserDto.urlImage.startsWith('data:image/')
    ) {
      if (user.publicIdImage) {
        await this.bucketService.deleteImageByName(user.publicIdImage);
      }

      const nameForImage = updateUserDto.name
        ? sanitizedName(updateUserDto.name)
        : sanitizedName(user.name);

      const imageUrl = await this.bucketService.uploadBase64Image(
        updateUserDto.urlImage,
        'users',
        nameForImage,
      );

      updateData.urlImage = imageUrl;
      updateData.publicIdImage = `users/${nameForImage}`;
    }

    if (updateUserDto.name) {
      updateData.name = updateUserDto.name.toLowerCase();
    }

    return this.userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);
    const admin = await this.adminService.findByUserId(id);

    if (admin && admin.length > 0) {
      await this.adminService.remove(admin[0]._id.toString());
    }

    await this.groupFamilyService.removeMembersFromGroupFamily(id);
    await this.bucketService.deleteImageByName(user.publicIdImage);
    return this.userModel.findByIdAndDelete(id);
  }
}
