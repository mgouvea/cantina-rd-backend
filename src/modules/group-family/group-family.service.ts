import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { UsersService } from '../users/users.service';
import { MemberDto } from './dto/add-member.dto';

@Injectable()
export class GroupFamilyService {
  constructor(
    @InjectModel(GroupFamily.name)
    private readonly groupFamilyModel: Model<GroupFamilyDocument>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  create(createGroupFamilyDto: CreateGroupFamilyDto) {
    const createdAt = new Date();
    return this.groupFamilyModel.create({
      ...createGroupFamilyDto,
      createdAt,
    });
  }

  async findAll() {
    const groupFamilies = await this.groupFamilyModel.find();
    const users = await this.usersService.findAll();

    return groupFamilies.map((groupFamily) => ({
      _id: groupFamily._id,
      name: groupFamily.name,
      owner: groupFamily.owner,
      ownerName: users.find((user) => user._id.toString() === groupFamily.owner)
        ?.name,
      ownerAvatar: users.find(
        (user) => user._id.toString() === groupFamily.owner,
      )?.imageBase64,
      members: groupFamily.members.map((member: any) => {
        // Extrair o userId do objeto member
        const memberId = typeof member === 'string' ? member : member.userId;
        const user = users.find((user) => user._id.toString() === memberId);
        return {
          userId: memberId,
          memberName: user?.name || '',
          memberAvatar: user?.imageBase64 || '',
        };
      }),
      createdAt: groupFamily.createdAt,
    }));
  }

  async findOne(id: string) {
    return this.groupFamilyModel.findById(id);
  }

  async findGroupFamilyName(groupFamilyId: string): Promise<string> {
    if (!groupFamilyId) return '';
    const groupFamily = await this.groupFamilyModel.findById(groupFamilyId);
    return groupFamily ? groupFamily.name : '';
  }

  async findAllWithOwnerName() {
    const groupFamilies = await this.groupFamilyModel.find();
    const users = await this.usersService.findAll();
    return groupFamilies.map((groupFamily) => ({
      _id: groupFamily._id,
      name: groupFamily.name,
      ownerName: users.find((user) => user._id.toString() === groupFamily.owner)
        ?.name,
      ownerAvatar: users.find(
        (user) => user._id.toString() === groupFamily.owner,
      )?.imageBase64,
    }));
  }

  async update(id: string, updateGroupFamilyDto: UpdateGroupFamilyDto) {
    return this.groupFamilyModel.findByIdAndUpdate(id, updateGroupFamilyDto, {
      new: true,
    });
  }

  async addOrRemoveMembersToGroupFamily(
    groupFamilyId: string,
    members: MemberDto[],
  ) {
    const groupFamily = await this.groupFamilyModel.findById(groupFamilyId);
    if (!groupFamily) {
      return null;
    }

    return this.groupFamilyModel.findByIdAndUpdate(
      groupFamilyId,
      { members },
      { new: true },
    );
  }

  async updateUsersGroupFamily(
    groupFamilyId: string,
    newGroupFamilyId: string | null,
  ) {
    const users = await this.usersService.findAll();
    const usersInGroup = users.filter(
      (user) =>
        user.groupFamily && user.groupFamily.toString() === groupFamilyId,
    );

    const updatePromises = usersInGroup.map((user) => {
      return this.usersService.update(user._id.toString(), {
        groupFamily: newGroupFamilyId,
      });
    });

    return Promise.all(updatePromises);
  }

  async removeMembersFromGroupFamily(idMembers: string | string[]) {
    const memberIds = Array.isArray(idMembers) ? idMembers : [idMembers];
    const groupFamilies = await this.groupFamilyModel.find({
      members: { $in: memberIds },
    });

    const updatePromises = groupFamilies.map((groupFamily) => {
      return this.groupFamilyModel.findByIdAndUpdate(
        groupFamily._id,
        { $pull: { members: { $in: memberIds } } },
        { new: true },
      );
    });

    return Promise.all(updatePromises);
  }

  async remove(id: string) {
    await this.updateUsersGroupFamily(id, null);
    return this.groupFamilyModel.findByIdAndDelete(id);
  }
}
