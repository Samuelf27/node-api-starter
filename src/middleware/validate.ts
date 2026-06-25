import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { HttpError } from '../lib/errors';

/** Valida `req.body` contra um schema Zod e substitui pelo valor tipado. */
export const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new HttpError(400, 'Dados inválidos.', err.flatten().fieldErrors));
      } else {
        next(err);
      }
    }
  };
