import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { seedAdmin } from '../src/db/repository';
import { env } from '../src/env';

const app = createApp();

let userTokens: { accessToken: string; refreshToken: string };
let userId: string;
let adminToken: string;

beforeAll(async () => {
  await seedAdmin();
});

describe('Health', () => {
  it('GET /health → ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('registra um novo usuário e retorna tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'João Teste', email: 'joao@example.com', password: 'senha123',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.accessToken).toBeTruthy();
    userTokens = res.body;
    userId = res.body.user.id;
  });

  it('rejeita e-mail duplicado (409)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Outro', email: 'joao@example.com', password: 'senha123',
    });
    expect(res.status).toBe(409);
  });

  it('valida o corpo (400 para senha curta)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Curto', email: 'curto@example.com', password: '12',
    });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeTruthy();
  });

  it('faz login com credenciais corretas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'joao@example.com', password: 'senha123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejeita login com senha errada (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'joao@example.com', password: 'errada',
    });
    expect(res.status).toBe(401);
  });

  it('GET /me com token → dados do usuário', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userTokens.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('joao@example.com');
  });

  it('GET /me sem token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('renova tokens com refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: userTokens.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    // Rotação: o refresh anterior foi invalidado; mantém o novo para próximos testes.
    userTokens.refreshToken = res.body.refreshToken;
  });
});

describe('Refresh token: rotação e revogação', () => {
  let tokens: { accessToken: string; refreshToken: string };

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Rotação Teste', email: 'rotacao@example.com', password: 'senha123',
    });
    tokens = res.body;
  });

  it('rejeita refresh token forjado/inválido (401)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'x'.repeat(40) });
    expect(res.status).toBe(401);
  });

  it('rotaciona e invalida o refresh antigo ao reutilizá-lo (401)', async () => {
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken: tokens.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).toBeTruthy();
    expect(first.body.refreshToken).not.toBe(tokens.refreshToken);

    // Reutilizar o refresh já rotacionado deve falhar.
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: tokens.refreshToken });
    expect(reuse.status).toBe(401);

    tokens.refreshToken = first.body.refreshToken;
  });

  it('logout revoga o refresh token (401 no refresh seguinte)', async () => {
    const logout = await request(app).post('/api/auth/logout').send({ refreshToken: tokens.refreshToken });
    expect(logout.status).toBe(204);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: tokens.refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('Access token: hardening', () => {
  it('rejeita access token forjado com segredo errado (401)', async () => {
    const forged = jwt.sign({ sub: 'x', role: 'ADMIN' }, 'segredo-errado');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejeita access token expirado (401)', async () => {
    const expired = jwt.sign({ sub: 'x', role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});

describe('RBAC + CRUD de usuários', () => {
  it('USER não pode listar usuários (403)', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${userTokens.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('ADMIN faz login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'admin123' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('ADMIN lista usuários (200)', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('ADMIN atualiza um usuário', async () => {
    const res = await request(app).patch(`/api/users/${userId}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ADMIN');
  });

  it('ADMIN remove um usuário (204) e depois 404', async () => {
    const del = await request(app).delete(`/api/users/${userId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/users/${userId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(get.status).toBe(404);
  });

  it('PATCH rejeita e-mail já usado por outro usuário (409)', async () => {
    const a = await request(app).post('/api/auth/register').send({ name: 'User A', email: 'usera@example.com', password: 'senha123' });
    const b = await request(app).post('/api/auth/register').send({ name: 'User B', email: 'userb@example.com', password: 'senha123' });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const res = await request(app)
      .patch(`/api/users/${b.body.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'usera@example.com' });
    expect(res.status).toBe(409);
  });
});
