import { z } from 'zod';

/** Validação das variáveis de ambiente — falha cedo se algo estiver faltando. */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_ACCESS_SECRET: z.string().min(8).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(8).default('dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
