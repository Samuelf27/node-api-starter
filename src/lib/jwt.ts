import jwt from 'jsonwebtoken';
import { env } from '../env';
import type { Role } from '../db/repository';

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export function signAccessToken(payload: TokenPayload): string {
  const opts = { expiresIn: env.ACCESS_TOKEN_TTL } as jwt.SignOptions;
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: TokenPayload): string {
  const opts = { expiresIn: env.REFRESH_TOKEN_TTL } as jwt.SignOptions;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
