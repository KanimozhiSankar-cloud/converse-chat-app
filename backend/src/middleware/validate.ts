import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

type Validator = (body: Record<string, unknown>) => string | null;

/**
 * Lightweight body-validation middleware factory. Pass a function that
 * returns an error message string when invalid, or null when valid.
 */
export function validateBody(validator: Validator) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const error = validator(req.body ?? {});
    if (error) {
      throw ApiError.badRequest(error);
    }
    next();
  };
}
