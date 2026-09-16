import { FilterQuery } from 'mongoose';
import { IUser, User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export async function listUsers(currentUserId: string, search?: string) {
  const filter: FilterQuery<IUser> = { _id: { $ne: currentUserId } };

  if (search && search.trim().length > 0) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  return User.find(filter).select('name username email avatar isOnline lastSeen').sort({ name: 1 });
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId).select('name username email avatar isOnline lastSeen');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

export async function updateUser(userId: string, input: { name?: string; email?: string; avatar?: string }) {
  const updates: { name?: string; email?: string; avatar?: string } = {};
  if (input.name !== undefined) {
    if (input.name.trim().length < 2) throw ApiError.badRequest('Name must be at least 2 characters');
    updates.name = input.name.trim();
  }
  if (input.email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(input.email)) throw ApiError.badRequest('A valid email is required');
    updates.email = input.email.trim().toLowerCase();
  }
  if (input.avatar !== undefined) updates.avatar = input.avatar.trim();

  try {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select('name username email avatar isOnline lastSeen');
    if (!user) throw ApiError.notFound('User not found');
    return user;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw ApiError.conflict('That email is already in use');
    throw error;
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) throw ApiError.badRequest('New password must be at least 8 characters');
  const user = await User.findById(userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
}
