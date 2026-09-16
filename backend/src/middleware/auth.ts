/// <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from "express";
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

/**
 * Verifies the Bearer JWT on the Authorization header and attaches
 * the decoded user id to req.userId. Rejects the request otherwise.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}
