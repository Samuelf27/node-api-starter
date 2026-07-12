export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'node-api-starter',
    version: '1.0.0',
    description: 'Boilerplate de API REST: JWT (access + refresh), RBAC, validação Zod e Swagger.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string' }, password: { type: 'string' } },
      },
      Register: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Cria uma conta',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Register' } } } },
        responses: { 201: { description: 'Criado (retorna tokens)' }, 409: { description: 'E-mail já existe' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Autentica e retorna tokens',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } } },
        responses: { 200: { description: 'OK (accessToken + refreshToken)' }, 401: { description: 'Credenciais inválidas' } },
      },
    },
    '/auth/refresh': {
      post: { tags: ['Auth'], summary: 'Renova (e rotaciona) os tokens a partir do refresh token', responses: { 200: { description: 'Novos tokens' }, 401: { description: 'Refresh token inválido/rotacionado' } } },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Revoga o refresh token do chamador', responses: { 204: { description: 'Revogado' } } },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Dados do usuário autenticado', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Não autenticado' } } },
    },
    '/users': {
      get: { tags: ['Users'], summary: 'Lista usuários (somente ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista' }, 403: { description: 'Sem permissão' } } },
    },
    '/users/{id}': {
      patch: { tags: ['Users'], summary: 'Atualiza um usuário (ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Atualizado' } } },
      delete: { tags: ['Users'], summary: 'Remove um usuário (ADMIN)', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Removido' } } },
    },
  },
} as const;
