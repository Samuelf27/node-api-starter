import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../lib/jwt';
import { unauthorized, forbidden } from '../lib/errors';
import type { Role } from '../db/repository';

// Estende o Request com o usuário autenticado
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/** Exige um access token válido no header Authorization: Bearer <token>. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthorized('Token ausente.'));
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(unauthorized('Token inválido ou expirado.'));
  }
}

/** Exige que o usuário tenha um dos papéis informados (RBAC). */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('Permissão insuficiente.'));
    next();
  };
}
