import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Mínimo de 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Mínimo de 6 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha obrigatória.'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token inválido.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
