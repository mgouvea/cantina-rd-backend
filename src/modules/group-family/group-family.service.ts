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
      )?.urlImage,
      members: groupFamily.members.map((member: any) => {
        // Extrair o userId do objeto member
        const memberId = typeof member === 'string' ? member : member.userId;
        const user = users.find((user) => user._id.toString() === memberId);
        return {
          userId: memberId,
          memberName: user?.name || '',
          memberAvatar: user?.urlImage || '',
        };
      }),
      createdAt: groupFamily.createdAt,
    }));
  }

  async findOne(id: string) {
    return this.groupFamilyModel.findById(id);
  }

  async findGroupFamilyName(groupFamilyId: string): Promise<string> {
    if (!groupFamilyId || groupFamilyId === '') return '';
    try {
      const groupFamily = await this.groupFamilyModel.findById(groupFamilyId);
      return groupFamily ? groupFamily.name : '';
    } catch (error) {
      // If there's an error (like invalid ObjectId), return empty string
      return '';
    }
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
      )?.urlImage,
    }));
  }

  async update(id: string, updateGroupFamilyDto: UpdateGroupFamilyDto) {
    return this.groupFamilyModel.findByIdAndUpdate(id, updateGroupFamilyDto, {
      new: true,
    });
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

  async addMembersToGroupFamily(groupFamilyId: string, membersIds: string[]) {
    const groupFamily = await this.groupFamilyModel.findById(groupFamilyId);
    if (!groupFamily) {
      return null;
    }

    // Array to store new members with their details
    const newMembers = [];

    // Process each member ID
    for (const memberId of membersIds) {
      // Fetch user details
      const user = await this.usersService.findOne(memberId);
      if (user) {
        // Add user to new members array with their details
        newMembers.push({
          userId: memberId,
          memberName: user.name || '',
          memberAvatar: user.urlImage || '',
        });

        // Update user's groupFamily reference
        await this.usersService.update(memberId, {
          groupFamily: groupFamilyId,
        });
      }
    }

    // Combine existing members with new members
    const updatedMembers = groupFamily.members.concat(newMembers);

    // Update the group family with the new members list
    return this.groupFamilyModel.findByIdAndUpdate(
      groupFamilyId,
      { members: updatedMembers },
      { new: true },
    );
  }

  async removeMembersFromGroupFamily(
    groupFamilyId: string,
    membersIds: string[],
  ) {
    // Check if groupFamilyId is valid before attempting to find it
    if (!groupFamilyId || groupFamilyId === '') {
      return null;
    }

    try {
      const groupFamily = await this.groupFamilyModel.findById(groupFamilyId);
      if (!groupFamily) {
        return null;
      }

      // Filter out members whose userId is in the membersIds array
      const updatedMembers = groupFamily.members.filter(
        (member) => !membersIds.includes(member.userId.toString()),
      );

      // Update the user documents to remove the groupFamily reference
      for (const memberId of membersIds) {
        await this.usersService.update(memberId, { groupFamily: null });
      }

      // Update the group family with the filtered members list
      return this.groupFamilyModel.findByIdAndUpdate(
        groupFamilyId,
        { members: updatedMembers },
        { new: true },
      );
    } catch (error) {
      console.error('Error in removeMembersFromGroupFamily:', error);
      return null;
    }
  }

  async removeOneMemberFromGroupFamily(
    groupFamilyId: string,
    memberId: string,
  ) {
    // Check if groupFamilyId is valid before attempting to find it
    if (!groupFamilyId || groupFamilyId === '') {
      return null;
    }

    try {
      const groupFamily = await this.groupFamilyModel.findById(groupFamilyId);
      if (!groupFamily) {
        return null;
      }

      const updatedMembers = groupFamily.members.filter(
        (member) => member.userId.toString() !== memberId,
      );

      return this.groupFamilyModel.findByIdAndUpdate(
        groupFamilyId,
        { members: updatedMembers },
        { new: true },
      );
    } catch (error) {
      console.error('Error in removeOneMemberFromGroupFamily:', error);
      return null;
    }
  }

  async remove(id: string) {
    await this.updateUsersGroupFamily(id, null);
    return this.groupFamilyModel.findByIdAndDelete(id);
  }
}
