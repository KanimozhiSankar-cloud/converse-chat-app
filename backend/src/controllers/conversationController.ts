import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getConversationsForUser,
  getMessagesForConversation,
  getOrCreatePrivateConversation,
} from '../services/conversationService';
import { searchMessages } from '../services/messageService';
import { ApiError } from '../utils/ApiError';
import { markConversationAsRead } from '../services/messageService';

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await getConversationsForUser(req.userId as string);
  res.status(200).json(conversations);
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const { userId: otherUserId } = req.body as { userId: string };
  if (!otherUserId) throw ApiError.badRequest('userId is required');

  const conversation = await getOrCreatePrivateConversation(req.userId as string, otherUserId);
  res.status(201).json(conversation);
});

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = await getMessagesForConversation(id, req.userId as string);
  await markConversationAsRead(id, req.userId as string);
  res.status(200).json(messages);
});

export const searchConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const messages = await searchMessages(req.params.id, req.userId as string, query);
  res.status(200).json(messages);
});
