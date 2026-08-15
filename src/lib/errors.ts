import type { Request, Response, NextFunction } from 'express';

/** Erro HTTP com status — usado em toda a aplicação. */
export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (m: string, d?: unknown) => new HttpError(400, m, d);
export const unauthorized = (m = 'Não autenticado.') => new HttpError(401, m);
export const forbidden = (m = 'Acesso negado.') => new HttpError(403, m);
export const notFound = (m = 'Recurso não encontrado.') => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);

/** Envolve handlers async para encaminhar erros ao middleware de erro. */
// Generico para deixar o tipo dos params atravessar o wrapper: no Express 5,
// `req.params` de um `Request` cru e `string | string[]` (wildcards `*nome`
// podem produzir arrays), e as rotas com `:id` precisam declarar
// `Request<{ id: string }>` para receber `string` — sem o generico, o wrapper
// apagava essa informacao.
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Req, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
