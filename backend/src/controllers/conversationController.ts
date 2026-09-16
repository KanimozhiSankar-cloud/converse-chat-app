import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  clearConversationMessages,
  deleteConversation,
  getConversationsForUser,
  getMessagesForConversation,
  getOrCreatePrivateConversation,
} from '../services/conversationService';
import { searchMessages } from '../services/messageService';
import { ApiError } from '../utils/ApiError';
import { markConversationAsRead } from '../services/messageService';
import { getIO } from '../socket';
import { Conversation } from '../models/Conversation';

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await getConversationsForUser(req.userId as string);
  res.status(200).json(conversations);
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const { userId: otherUserId } = req.body as { userId: string };
  if (!otherUserId) throw ApiError.badRequest('userId is required');

  const existingConversation = await Conversation.exists({
    type: 'private',
    participants: { $all: [req.userId, otherUserId], $size: 2 },
  });
  const conversation = await getOrCreatePrivateConversation(req.userId as string, otherUserId);
  if (!existingConversation) {
    const participantIds = conversation.participants.map((participant) => participant._id.toString());
    participantIds.forEach((participantId) => {
      getIO().to(participantId).emit('conversation:created', {
        conversation: { ...conversation.toObject(), unreadCount: 0 },
        createdBy: req.userId,
      });
    });
  }
  res.status(201).json(conversation);
});

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = await getMessagesForConversation(id, req.userId as string);
  await markConversationAsRead(id, req.userId as string);
  res.status(200).json(messages);
});

export const markConversationRead = asyncHandler(async (req: Request, res: Response) => {
  await markConversationAsRead(req.params.id, req.userId as string);
  res.status(204).send();
});

export const searchConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const messages = await searchMessages(req.params.id, req.userId as string, query);
  res.status(200).json(messages);
});

export const clearMessages = asyncHandler(async (req: Request, res: Response) => {
  await clearConversationMessages(req.params.id, req.userId as string);
  getIO().to(req.userId as string).emit('conversation:clear', { conversationId: req.params.id });
  res.status(204).send();
});

export const removeConversation = asyncHandler(async (req: Request, res: Response) => {
  await deleteConversation(req.params.id, req.userId as string);
  getIO().to(req.userId as string).emit('conversation:delete', { conversationId: req.params.id });
  res.status(204).send();
});
