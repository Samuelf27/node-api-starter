import { createApp } from './app';
import { env } from './env';
import { seedAdmin } from './db/repository';

async function main() {
  const admin = await seedAdmin();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`\n🚀  node-api-starter rodando em http://localhost:${env.PORT}`);
    console.log(`📚  Docs (Swagger): http://localhost:${env.PORT}/docs`);
    // Mostra apenas o e-mail do seed (nunca a senha) e somente fora de produção.
    if (admin && env.NODE_ENV !== 'production') {
      console.log(`🔑  Admin seed: ${admin.email}\n`);
    }
  });
}

main();
