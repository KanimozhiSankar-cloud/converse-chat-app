import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { loginUser, registerUser, requestPasswordReset, resetPassword } from '../services/authService';
import { ApiError } from '../utils/ApiError';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, username, email, password } = req.body as { name: string; username: string; email: string; password: string };
  const result = await registerUser({ name, username, email, password });
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await loginUser({ email, password });
  res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (email && /^\S+@\S+\.\S+$/.test(email)) await requestPasswordReset(email);
  res.status(200).json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password || password.length < 8) {
    throw ApiError.badRequest('A valid token and password of at least 8 characters are required');
  }
  await resetPassword(token, password);
  res.status(200).json({ message: 'Password reset successfully' });
});
