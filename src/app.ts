import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { authRoutes } from './modules/auth/routes';
import { userRoutes } from './modules/users/routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { openapiSpec } from './docs/openapi';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Documentação interativa
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
