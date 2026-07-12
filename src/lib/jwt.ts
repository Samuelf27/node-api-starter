import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../env';
import type { Role } from '../db/repository';

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string; // id único do refresh token (usado para rotação/revogação)
}

// Fixa o algoritmo esperado na verificação — evita ataques de confusão de algoritmo.
const verifyOpts: jwt.VerifyOptions = { algorithms: ['HS256'] };

export function signAccessToken(payload: TokenPayload): string {
  const opts = { expiresIn: env.ACCESS_TOKEN_TTL } as jwt.SignOptions;
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

/** Emite um refresh token com um `jti` único e o retorna para registro/rotação. */
export function signRefreshToken(payload: TokenPayload): { token: string; jti: string } {
  const jti = randomUUID();
  const opts = { expiresIn: env.REFRESH_TOKEN_TTL, jwtid: jti } as jwt.SignOptions;
  return { token: jwt.sign(payload, env.JWT_REFRESH_SECRET, opts), jti };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, verifyOpts) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, verifyOpts) as RefreshTokenPayload;
}
