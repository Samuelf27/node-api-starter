import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/errors';
import { env } from '../env';

/** Handler global de erros — resposta JSON consistente. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}
