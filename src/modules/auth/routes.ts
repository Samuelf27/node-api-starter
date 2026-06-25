import { Router } from 'express';
import { asyncHandler } from '../../lib/errors';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { registerSchema, loginSchema, refreshSchema } from './schemas';
import { authService } from './service';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),
);

authRoutes.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    res.json(await authService.login(req.body));
  }),
);

authRoutes.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    res.json(await authService.refresh(req.body.refreshToken));
  }),
);

authRoutes.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await authService.me(req.user!.sub));
  }),
);
