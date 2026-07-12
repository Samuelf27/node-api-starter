import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Habilita o seed de admin apenas para os testes (credenciais fixas de teste).
    env: {
      SEED_ADMIN: 'true',
      SEED_ADMIN_EMAIL: 'admin@example.com',
      SEED_ADMIN_PASSWORD: 'admin123',
    },
  },
});
