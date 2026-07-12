import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, notFound, conflict } from '../../lib/errors';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { userRepository, toPublic } from '../../db/repository';

export const userRoutes = Router();

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

// Todas as rotas exigem autenticação + papel ADMIN
userRoutes.use(authenticate, authorize('ADMIN'));

userRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await userRepository.list();
    res.json(users.map(toPublic));
  }),
);

userRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await userRepository.findById(req.params.id);
    if (!user) throw notFound('Usuário não encontrado.');
    res.json(toPublic(user));
  }),
);

userRoutes.patch(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    // Impede atualizar para um e-mail já usado por outro usuário.
    if (req.body.email) {
      const existing = await userRepository.findByEmail(req.body.email);
      if (existing && existing.id !== req.params.id) {
        throw conflict('E-mail já cadastrado.');
      }
    }
    const user = await userRepository.update(req.params.id, req.body);
    if (!user) throw notFound('Usuário não encontrado.');
    res.json(toPublic(user));
  }),
);

userRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const ok = await userRepository.delete(req.params.id);
    if (!ok) throw notFound('Usuário não encontrado.');
    res.status(204).send();
  }),
);
