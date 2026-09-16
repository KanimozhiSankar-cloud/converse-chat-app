import { Types } from 'mongoose';
import { Conversation, IConversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { ApiError } from '../utils/ApiError';

export async function getConversationsForUser(userId: string) {
  const conversations = await Conversation.find({ participants: userId, hiddenFor: { $ne: userId } })
    .populate('participants', 'name username email avatar isOnline lastSeen')
    .populate('groupAdmin', 'name email avatar')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name avatar' },
    })
    .sort({ updatedAt: -1 });

  // Attach unread counts per conversation for the requesting user.
  const withUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const visibleFrom = getVisibleMessagesFrom(conversation, userId);
      const visibleMessages = {
        conversationId: conversation._id,
        ...(visibleFrom ? { createdAt: { $gt: visibleFrom } } : {}),
      };
      const lastMessage = await Message.findOne(visibleMessages)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
        ...(visibleFrom ? { createdAt: { $gt: visibleFrom } } : {}),
      });
      return { ...conversation.toObject(), lastMessage: lastMessage ?? undefined, unreadCount };
    })
  );

  return withUnread;
}

export async function getOrCreatePrivateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw ApiError.badRequest('Cannot start a conversation with yourself');
  }

  let conversation = await Conversation.findOne({
    type: 'private',
    participants: { $all: [userId, otherUserId], $size: 2 },
  })
    .populate('participants', 'name username email avatar isOnline lastSeen')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name avatar' } });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'private',
      participants: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
    });
    conversation = await conversation.populate('participants', 'name username email avatar isOnline lastSeen');
  } else {
    if (conversation.hiddenFor.some((id) => id.toString() === userId) && !getDeletedAt(conversation, userId)) {
      conversation.deletedAt.push({ userId: new Types.ObjectId(userId), at: new Date() });
    }
    conversation.hiddenFor = conversation.hiddenFor.filter((id) => id.toString() !== userId);
    await conversation.save();
  }

  return conversation;
}

export async function getConversationById(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'name username email avatar isOnline lastSeen')
    .populate('groupAdmin', 'name email avatar');

  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  if (conversation.hiddenFor.some((id) => id.toString() === userId)) {
    throw ApiError.notFound('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => p._id.toString() === userId);
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  return conversation;
}

export async function getMessagesForConversation(conversationId: string, userId: string) {
  // Ensures the requester belongs to the conversation before returning history.
  const conversation = await getConversationById(conversationId, userId);

  const visibleFrom = getVisibleMessagesFrom(conversation, userId);
  return Message.find({ conversationId, ...(visibleFrom ? { createdAt: { $gt: visibleFrom } } : {}) })
    .populate('sender', 'name avatar')
    .populate({ path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name avatar' } })
    .sort({ createdAt: 1 });
}

export async function clearConversationMessages(conversationId: string, userId: string): Promise<void> {
  const conversation = await getConversationById(conversationId, userId);
  conversation.clearedAt = conversation.clearedAt.filter((entry) => entry.userId.toString() !== userId);
  conversation.clearedAt.push({ userId: new Types.ObjectId(userId), at: new Date() });
  await conversation.save();
}

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  const conversation = await getConversationById(conversationId, userId);
  conversation.hiddenFor = conversation.hiddenFor.filter((id) => id.toString() !== userId);
  conversation.hiddenFor.push(new Types.ObjectId(userId));
  conversation.deletedAt = conversation.deletedAt.filter((entry) => entry.userId.toString() !== userId);
  conversation.deletedAt.push({ userId: new Types.ObjectId(userId), at: new Date() });
  await conversation.save();
}

export function getClearedAt(conversation: IConversation, userId: string): Date | undefined {
  return conversation.clearedAt.find((entry) => entry.userId.toString() === userId)?.at;
}

export function getDeletedAt(conversation: IConversation, userId: string): Date | undefined {
  return conversation.deletedAt.find((entry) => entry.userId.toString() === userId)?.at;
}

export function getVisibleMessagesFrom(conversation: IConversation, userId: string): Date | undefined {
  const deletedAt = getDeletedAt(conversation, userId);
  const clearedAt = getClearedAt(conversation, userId);
  if (!deletedAt) return clearedAt;
  if (!clearedAt) return deletedAt;
  return deletedAt > clearedAt ? deletedAt : clearedAt;
}
