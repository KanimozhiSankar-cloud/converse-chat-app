import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { deleteMessage, editMessage, markMessageAsRead, sendMessage } from '../services/messageService';
import { ApiError } from '../utils/ApiError';
import { emitMessageToParticipants, getIO } from '../socket';

export const postMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, content, replyToId } = req.body as { conversationId: string; content: string; replyToId?: string };
  if (!conversationId) throw ApiError.badRequest('conversationId is required');

  const message = await sendMessage({ conversationId, senderId: req.userId as string, content, replyToId });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SOCKET] message created messageId=${message._id} conversationId=${conversationId} senderId=${req.userId}`);
  }
  await emitMessageToParticipants(conversationId, message);
  if (process.env.NODE_ENV !== 'production') console.log('[SOCKET] emitted event=message:receive');

  res.status(201).json(message);
});

export const readMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await markMessageAsRead(req.params.id, req.userId as string);
  getIO().to(message.conversationId.toString()).emit('message:read', {
    messageId: message._id,
    conversationId: message.conversationId,
    userId: req.userId,
  });
  res.status(200).json(message);
});

export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content: string };
  const message = await editMessage(req.params.id, req.userId as string, content ?? '');
  getIO().to(message.conversationId.toString()).emit('message:update', message);
  res.status(200).json(message);
});

export const removeMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await deleteMessage(req.params.id, req.userId as string);
  getIO().to(message.conversationId.toString()).emit('message:delete', {
    messageId: message._id,
    conversationId: message.conversationId,
  });
  res.status(204).send();
});
