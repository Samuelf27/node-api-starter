import { randomUUID } from 'node:crypto';
import { hashPassword } from '../lib/password';
import { env } from '../env';

export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;
export const toPublic = ({ passwordHash: _ph, ...rest }: User): PublicUser => rest;

/**
 * Interface do repositório. A implementação em memória abaixo pode ser
 * substituída por uma baseada em Prisma/PostgreSQL sem mudar os serviços.
 * (Veja prisma/schema.prisma e o README.)
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async findById(id: string) {
    return this.users.get(id) ?? null;
  }
  async list() {
    return [...this.users.values()];
  }
  async create(data: Omit<User, 'id' | 'createdAt'>) {
    const user: User = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
    this.users.set(user.id, user);
    return user;
  }
  async update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>) {
    const user = this.users.get(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }
  async delete(id: string) {
    return this.users.delete(id);
  }
}

export const userRepository: UserRepository = new InMemoryUserRepository();

/**
 * Cria um admin inicial (idempotente). Só executa quando SEED_ADMIN=true e as
 * credenciais vêm de SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (nada hardcoded).
 * Retorna o admin (público) quando semeia/já existe, ou null quando desativado.
 */
export async function seedAdmin(): Promise<PublicUser | null> {
  if (!env.SEED_ADMIN) return null;
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = env;
  if (!email || !password) {
    throw new Error('SEED_ADMIN=true exige SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD.');
  }
  const existing = await userRepository.findByEmail(email);
  if (existing) return toPublic(existing);
  const user = await userRepository.create({
    name: 'Admin',
    email,
    passwordHash: await hashPassword(password),
    role: 'ADMIN',
  });
  return toPublic(user);
}
