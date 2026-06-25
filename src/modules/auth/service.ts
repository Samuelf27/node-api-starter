import { userRepository, toPublic, type PublicUser } from '../../db/repository';
import { hashPassword, comparePassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { conflict, unauthorized } from '../../lib/errors';
import type { RegisterInput, LoginInput } from './schemas';

interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function issueTokens(id: string, role: 'ADMIN' | 'USER') {
  return {
    accessToken: signAccessToken({ sub: id, role }),
    refreshToken: signRefreshToken({ sub: id, role }),
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

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Refresh token inválido ou expirado.');
    }
    const user = await userRepository.findById(payload.sub);
    if (!user) throw unauthorized('Usuário não encontrado.');
    return issueTokens(user.id, user.role);
  },

  async me(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) throw unauthorized();
    return toPublic(user);
  },
};
