import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { ApiError } from '../utils/ApiError';

export async function getConversationsForUser(userId: string) {
  const conversations = await Conversation.find({ participants: userId })
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
      const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });
      return { ...conversation.toObject(), unreadCount };
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

  const isParticipant = conversation.participants.some((p) => p._id.toString() === userId);
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  return conversation;
}

export async function getMessagesForConversation(conversationId: string, userId: string) {
  // Ensures the requester belongs to the conversation before returning history.
  await getConversationById(conversationId, userId);

  return Message.find({ conversationId }).populate('sender', 'name avatar').sort({ createdAt: 1 });
}
