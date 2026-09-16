import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Central error handler. Normalizes known ApiErrors, Mongoose
 * validation/cast errors, and duplicate-key errors into a consistent
 * JSON shape so the frontend can render meaningful messages.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err && typeof err === 'object' && 'name' in err) {
    const mongooseErr = err as { name: string; code?: number; message: string; errors?: Record<string, { message: string }> };

    if (mongooseErr.name === 'ValidationError' && mongooseErr.errors) {
      const messages = Object.values(mongooseErr.errors).map((e) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }

    if (mongooseErr.name === 'CastError') {
      res.status(400).json({ message: 'Invalid identifier supplied' });
      return;
    }

    if (mongooseErr.code === 11000) {
      res.status(409).json({ message: 'A record with these details already exists' });
      return;
    }
  }

  console.error('[unhandled error]', err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
