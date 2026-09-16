import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { changePassword, getUserById, listUsers, updateUser } from '../services/userService';
import { ApiError } from '../utils/ApiError';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const users = await listUsers(req.userId as string, search);
  res.status(200).json(users);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) throw ApiError.badRequest('User id is required');
  const user = await getUserById(req.params.id);
  res.status(200).json(user);
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.userId as string);
  res.status(200).json(user);
});

export const updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUser(req.userId as string, req.body as { name?: string; email?: string; avatar?: string });
  res.status(200).json(user);
});

export const updateCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) throw ApiError.badRequest('Current and new passwords are required');
  await changePassword(req.userId as string, currentPassword, newPassword);
  res.status(200).json({ message: 'Password changed successfully' });
});
