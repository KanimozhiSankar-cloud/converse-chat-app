import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { IMessage, Message } from '../models/Message';
import { ApiError } from '../utils/ApiError';
import { getConversationById, getDeletedAt, getVisibleMessagesFrom } from './conversationService';

interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  replyToId?: string;
}

export async function sendMessage(input: SendMessageInput): Promise<IMessage> {
  const { conversationId, senderId, content, replyToId } = input;

  if (!content || content.trim().length === 0) {
    throw ApiError.badRequest('Message content cannot be empty');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  let replyTo: Types.ObjectId | undefined;
  if (replyToId) {
    if (!Types.ObjectId.isValid(replyToId)) throw ApiError.badRequest('Invalid reply message');
    const repliedMessage = await Message.findOne({ _id: replyToId, conversationId });
    if (!repliedMessage) throw ApiError.notFound('Reply message not found');
    replyTo = repliedMessage._id;
  }

  const deletionBoundary = new Date();
  const message = await Message.create({
    conversationId,
    sender: senderId,
    replyTo,
    content: content.trim(),
    readBy: [senderId],
  });

  conversation.lastMessage = message._id;
  conversation.hiddenFor.forEach((hiddenUserId) => {
    if (!getDeletedAt(conversation, hiddenUserId.toString())) {
      conversation.deletedAt.push({ userId: hiddenUserId, at: deletionBoundary });
    }
  });
  conversation.hiddenFor = conversation.hiddenFor.filter(
    (hiddenUserId) => !conversation.participants.some((participantId) => participantId.toString() === hiddenUserId.toString())
  );
  await conversation.save();

  await message.populate('sender', 'name avatar');
  await message.populate({ path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name avatar' } });
  return message;
}

export async function markMessageAsRead(messageId: string, userId: string): Promise<IMessage> {
  const message = await Message.findById(messageId);
  if (!message) {
    throw ApiError.notFound('Message not found');
  }

  const alreadyRead = message.readBy.some((id) => id.toString() === userId);
  if (!alreadyRead) {
    message.readBy.push(new Types.ObjectId(userId));
    await message.save();
  }

  return message.populate('sender', 'name avatar');
}

export async function editMessage(messageId: string, userId: string, content: string): Promise<IMessage> {
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    throw ApiError.badRequest('Message content cannot be empty');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw ApiError.notFound('Message not found');
  }
  if (message.sender.toString() !== userId) {
    throw ApiError.forbidden('You can only edit your own messages');
  }

  message.content = trimmedContent;
  await message.save();
  return message.populate('sender', 'name avatar');
}

export async function deleteMessage(messageId: string, userId: string): Promise<IMessage> {
  const message = await Message.findById(messageId);
  if (!message) {
    throw ApiError.notFound('Message not found');
  }
  if (message.sender.toString() !== userId) {
    throw ApiError.forbidden('You can only delete your own messages');
  }

  await message.deleteOne();
  return message;
}

export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  await getConversationById(conversationId, userId);
  await Message.updateMany(
    { conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
}

export async function searchMessages(conversationId: string, userId: string, query: string): Promise<IMessage[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) return [];

  const conversation = await getConversationById(conversationId, userId);
  const visibleFrom = getVisibleMessagesFrom(conversation, userId);
  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Message.find({
    conversationId,
    content: { $regex: escapedQuery, $options: 'i' },
    ...(visibleFrom ? { createdAt: { $gt: visibleFrom } } : {}),
  })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });
}
