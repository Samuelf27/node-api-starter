import { createApp } from './app';
import { env } from './env';
import { seedAdmin } from './db/repository';

async function main() {
  await seedAdmin();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`\n🚀  node-api-starter rodando em http://localhost:${env.PORT}`);
    console.log(`📚  Docs (Swagger): http://localhost:${env.PORT}/docs`);
    console.log(`🔑  Admin seed: admin@example.com / admin123\n`);
  });
}

main();
