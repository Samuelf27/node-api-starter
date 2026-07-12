import { userRepository, toPublic, type PublicUser, type Role } from '../../db/repository';
import { hashPassword, comparePassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { conflict, unauthorized } from '../../lib/errors';
import type { RegisterInput, LoginInput } from './schemas';

interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Conjunto (em memória) dos `jti` de refresh tokens válidos.
 * Acompanha a abordagem em memória do repositório: é reiniciado a cada restart
 * do processo (todos os refresh tokens são invalidados). Numa implementação real,
 * troque por Redis ou uma tabela persistente.
 */
const validRefreshJtis = new Set<string>();

function issueTokens(id: string, role: Role) {
  const { token: refreshToken, jti } = signRefreshToken({ sub: id, role });
  validRefreshJtis.add(jti);
  return {
    accessToken: signAccessToken({ sub: id, role }),
    refreshToken,
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    if (await userRepository.findByEmail(input.email)) {
      throw conflict('E-mail já cadastrado.');
    }
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'USER',
    });
    return { user: toPublic(user), ...issueTokens(user.id, user.role) };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw unauthorized('Credenciais inválidas.');
    }
    return { user: toPublic(user), ...issueTokens(user.id, user.role) };
  },

  /** Verifica o refresh token, invalida o `jti` antigo e emite um novo par (rotação). */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Refresh token inválido ou expirado.');
    }
    // O jti precisa continuar válido — rejeita tokens já rotacionados/revogados.
    if (!payload.jti || !validRefreshJtis.has(payload.jti)) {
      throw unauthorized('Refresh token inválido ou expirado.');
    }
    const user = await userRepository.findById(payload.sub);
    if (!user) throw unauthorized('Usuário não encontrado.');
    // Rotação: o refresh antigo deixa de valer e um novo é emitido.
    validRefreshJtis.delete(payload.jti);
    return issueTokens(user.id, user.role);
  },

  /** Revoga o refresh token do chamador (logout). Idempotente. */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      if (payload.jti) validRefreshJtis.delete(payload.jti);
    } catch {
      // Token inválido/expirado: nada a revogar.
    }
  },

  async me(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) throw unauthorized();
    return toPublic(user);
  },
};
