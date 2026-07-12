import { randomBytes } from 'node:crypto';
import { z } from 'zod';

/** Segredos placeholder conhecidos — nunca devem ser usados em produção. */
const PLACEHOLDER_SECRETS = new Set([
  'dev-access-secret-change-me',
  'dev-refresh-secret-change-me',
  'change-me-access',
  'change-me-refresh',
  'CHANGE_ME',
  'troque-este-segredo-de-acesso',
  'troque-este-segredo-de-refresh',
]);

const MIN_SECRET_LENGTH = 32;

/** Validação das variáveis de ambiente — falha cedo se algo estiver faltando. */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  // Origens permitidas para CORS (separadas por vírgula). Vazio: reflete em dev, bloqueia em produção.
  CORS_ORIGIN: z.string().optional(),
  // Seed opcional de admin (ver src/db/repository.ts).
  SEED_ADMIN: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;
const isProd = data.NODE_ENV === 'production';

/**
 * Resolve um segredo JWT.
 * Em produção: falha cedo (throw) se ausente, curto (< 32 chars) ou placeholder.
 * Em dev/test: cai para um segredo efêmero gerado (com aviso) — tokens não sobrevivem a restart.
 */
function resolveSecret(name: string, value: string | undefined): string {
  const isStrong =
    !!value && value.length >= MIN_SECRET_LENGTH && !PLACEHOLDER_SECRETS.has(value);
  if (isStrong) return value;

  if (isProd) {
    throw new Error(
      `${name} é obrigatório em produção, deve ter ≥ ${MIN_SECRET_LENGTH} caracteres e não pode ser um placeholder. ` +
        'Gere um valor forte com: openssl rand -hex 32',
    );
  }

  console.warn(
    `⚠️  ${name} ausente ou fraco — usando um segredo efêmero gerado (${data.NODE_ENV}). ` +
      'Os tokens serão invalidados a cada reinício. Defina um valor forte no .env.',
  );
  return randomBytes(MIN_SECRET_LENGTH).toString('hex');
}

export const env = {
  ...data,
  JWT_ACCESS_SECRET: resolveSecret('JWT_ACCESS_SECRET', data.JWT_ACCESS_SECRET),
  JWT_REFRESH_SECRET: resolveSecret('JWT_REFRESH_SECRET', data.JWT_REFRESH_SECRET),
};
