import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { authRoutes } from './modules/auth/routes';
import { userRoutes } from './modules/users/routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { openapiSpec } from './docs/openapi';
import { env } from './env';

export function createApp() {
  const app = express();

  app.use(helmet());

  // Origem permitida via CORS_ORIGIN (lista separada por vírgula).
  // Sem a variável: reflete a origem em dev/test e bloqueia em produção.
  const corsOrigin =
    env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? env.NODE_ENV !== 'production';
  app.use(cors({ origin: corsOrigin }));

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Documentação interativa (CSP relaxada para carregar os assets do Swagger UI).
  app.use(
    '/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec),
  );

  // API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
