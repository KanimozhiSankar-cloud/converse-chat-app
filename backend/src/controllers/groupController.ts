import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createGroup, getGroupById } from '../services/groupService';
import { ApiError } from '../utils/ApiError';

export const createGroupConversation = asyncHandler(async (req: Request, res: Response) => {
  const { groupName, memberIds } = req.body as { groupName: string; memberIds: string[] };
  if (!Array.isArray(memberIds)) throw ApiError.badRequest('memberIds must be an array');

  const group = await createGroup({ groupName, memberIds, adminId: req.userId as string });
  res.status(201).json(group);
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await getGroupById(req.params.id, req.userId as string);
  res.status(200).json(group);
});
