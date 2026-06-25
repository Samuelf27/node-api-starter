import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { seedAdmin } from '../src/db/repository';

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
});
