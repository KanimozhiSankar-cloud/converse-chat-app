import { IUser, User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import { createHash, randomBytes } from 'crypto';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { env } from '../config/env';

interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

interface AuthResult {
  token: string;
  user: Pick<IUser, '_id' | 'name' | 'username' | 'email' | 'avatar'>;
}

function toPublicUser(user: IUser) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ $or: [{ email: input.email.toLowerCase() }, { username: input.username.toLowerCase() }] });
  if (existing) {
    throw ApiError.conflict('That email or username is already in use');
  }

  const user = await User.create({
    name: input.name,
    username: input.username.toLowerCase(),
    email: input.email.toLowerCase(),
    password: input.password,
  });

  const token = signToken({ userId: user._id.toString() });
  return { token, user: toPublicUser(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ userId: user._id.toString() });
  return { token, user: toPublicUser(user) };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) return;

  await PasswordResetToken.deleteMany({ userId: user._id });
  const rawToken = randomBytes(32).toString('hex');
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + env.passwordResetExpiresMinutes * 60 * 1000),
  });

  if (env.nodeEnv !== 'production') {
    console.info(`[auth] Development password reset link: ${env.clientUrl}/reset-password?token=${rawToken}`);
  }
}

export async function resetPassword(rawToken: string, password: string): Promise<void> {
  const resetToken = await PasswordResetToken.findOne({
    tokenHash: hashResetToken(rawToken),
    expiresAt: { $gt: new Date() },
  });
  if (!resetToken) throw ApiError.badRequest('This password reset link is invalid or expired');

  const user = await User.findById(resetToken.userId).select('+password');
  if (!user) throw ApiError.badRequest('This password reset link is invalid or expired');

  user.password = password;
  await user.save();
  await PasswordResetToken.deleteOne({ _id: resetToken._id });
}
