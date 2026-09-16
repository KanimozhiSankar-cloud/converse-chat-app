import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { ApiError } from '../utils/ApiError';

interface CreateGroupInput {
  groupName: string;
  memberIds: string[];
  adminId: string;
}

export async function createGroup(input: CreateGroupInput) {
  const { groupName, memberIds, adminId } = input;

  if (!groupName || groupName.trim().length === 0) {
    throw ApiError.badRequest('Group name is required');
  }

  const uniqueMembers = Array.from(new Set([...memberIds, adminId]));

  if (uniqueMembers.length < 3) {
    throw ApiError.badRequest('A group needs at least 2 other members');
  }

  const conversation = await Conversation.create({
    type: 'group',
    groupName: groupName.trim(),
    participants: uniqueMembers.map((id) => new Types.ObjectId(id)),
    groupAdmin: new Types.ObjectId(adminId),
  });

  return conversation.populate('participants', 'name email avatar isOnline lastSeen');
}

export async function getGroupById(groupId: string, userId: string) {
  const group = await Conversation.findOne({ _id: groupId, type: 'group' })
    .populate('participants', 'name email avatar isOnline lastSeen')
    .populate('groupAdmin', 'name email avatar');

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const isParticipant = group.participants.some((p) => p._id.toString() === userId);
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  return group;
}
