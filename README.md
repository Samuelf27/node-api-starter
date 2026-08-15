<h1 align="center">🔐 node-api-starter</h1>

<p align="center">
Boilerplate de <b>API REST em produção</b> com TypeScript — autenticação JWT (access + refresh), RBAC, validação, Swagger, testes e Docker.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white"/>
  <img src="https://github.com/Samuelf27/node-api-starter/actions/workflows/ci.yml/badge.svg"/>
  <img src="https://img.shields.io/badge/tests-20%20passing-34d399?style=flat"/>
</p>

---

## 📌 Sobre

Um ponto de partida **pronto para produção** para APIs Node.js — resolvendo as partes que toda empresa precisa e ninguém quer reescrever: autenticação, autorização por papéis, validação de entrada, documentação e testes. Arquitetura em camadas e **repositório plugável** (troque memória → PostgreSQL sem mexer nos serviços).

## ✨ O que vem pronto

- 🔑 **Autenticação JWT** com **access + refresh token** e **rotação + revogação** (logout)
- 🛡️ **RBAC** — autorização por papéis (`ADMIN`, `USER`)
- 🔒 Senhas com **bcrypt** (via `bcryptjs`)
- 🪖 **Helmet** (headers de segurança) + **CORS** por origem configurável
- 🚦 **Rate limiting** nas rotas sensíveis de autenticação (register/login/refresh) (`express-rate-limit`)
- ✅ **Validação** de entrada com **Zod** (erros 400 estruturados)
- 📚 **Swagger UI** em `/docs` (OpenAPI 3)
- 🧪 **20 testes de integração** (Vitest + Supertest)
- 🐳 **Docker** + **docker-compose** (com PostgreSQL)
- ⚙️ **CI** no GitHub Actions (typecheck + testes + build)
- 🧱 Arquitetura modular (config, lib, middleware, modules)

## 🔗 Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Cria conta (retorna tokens) |
| `POST` | `/api/auth/login` | — | Login (retorna tokens) |
| `POST` | `/api/auth/refresh` | — | Renova e **rotaciona** os tokens |
| `POST` | `/api/auth/logout` | — | Revoga o refresh token informado |
| `GET` | `/api/auth/me` | Bearer | Dados do usuário logado |
| `GET` | `/api/users` | ADMIN | Lista usuários |
| `GET` | `/api/users/:id` | ADMIN | Detalhe |
| `PATCH` | `/api/users/:id` | ADMIN | Atualiza |
| `DELETE` | `/api/users/:id` | ADMIN | Remove |
| `GET` | `/health` · `/docs` | — | Status · Documentação |

## 🚀 Como rodar

```bash
npm install
cp .env.example .env   # gere segredos JWT fortes: openssl rand -hex 32
npm run dev        # http://localhost:3000  (docs em /docs)
npm test           # 20 testes de integração
npm run build      # bundle de produção (tsup)
```

> ⚠️ **Segredos JWT são obrigatórios.** Em `production` a aplicação **falha ao iniciar**
> se `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` estiverem ausentes, com menos de 32
> caracteres ou usando placeholders conhecidos. Em dev/test, um segredo efêmero é
> gerado automaticamente (com aviso) e os tokens são invalidados a cada reinício.

### 🔑 Admin (seed opcional)

Não há admin pré-cadastrado por padrão. Para semear um, defina no `.env`:

```bash
SEED_ADMIN=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=uma-senha-forte
```

O seed é ignorado quando `SEED_ADMIN` não é `true`, e as credenciais nunca são
impressas em produção.

### 🔁 Refresh tokens (rotação + revogação)

`/api/auth/refresh` valida o refresh token, **invalida o token usado** e emite um novo
par (rotação). Reutilizar um refresh token já rotacionado retorna `401`. `/api/auth/logout`
revoga o refresh token informado. Os `jti` válidos ficam num **store em memória** que,
como o repositório de usuários, **é reiniciado a cada restart do processo** — troque por
Redis/banco numa implementação real.

### Com Docker
```bash
docker compose up --build   # ajuste os segredos JWT no docker-compose.yml antes
```

### Exemplo
```bash
# login (use as credenciais do seu seed, se habilitado)
curl -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"uma-senha-forte"}'

# usar o token
curl localhost:3000/api/auth/me -H "Authorization: Bearer <accessToken>"
```

## 🗄️ Banco de dados real (PostgreSQL + Prisma)

O projeto usa um **repositório em memória** por padrão (zero setup). Para produção, há um [`prisma/schema.prisma`](prisma/schema.prisma) pronto:

1. `npm i @prisma/client && npm i -D prisma`
2. Configure `DATABASE_URL` no `.env`
3. `npx prisma migrate dev`
4. Implemente `UserRepository` ([`src/db/repository.ts`](src/db/repository.ts)) usando o Prisma Client

A interface `UserRepository` garante que **nenhum serviço precisa mudar**.

## 🧱 Estrutura

```
src/
├── env.ts                 # variáveis validadas com Zod
├── app.ts / server.ts     # app Express + bootstrap
├── lib/                   # jwt, password, errors
├── db/repository.ts       # camada de dados (plugável)
├── middleware/            # auth, authorize (RBAC), validate, errors
├── modules/auth/          # register, login, refresh, logout, me
├── modules/users/         # CRUD com RBAC
└── docs/openapi.ts        # spec OpenAPI
```

## 🧪 Testes

**20 testes** de integração HTTP (Vitest), rodando no CI a cada push e pull request.

A suíte exercita a API pelo endpoint, não por unidade isolada — cobrindo o caminho feliz e, principalmente, os códigos de erro:

- Registro de usuário e emissão de tokens
- E-mail duplicado → `409`
- Corpo inválido (senha curta) → `400`
- Login correto e senha errada → `401`
- Rota autenticada com e sem token → dados do usuário / `401`
- `GET /health`

```bash
npm test
```

## 📄 Licença

[MIT](LICENSE) © Samuel Ferreira

---

<p align="center">
  <a href="https://github.com/Samuelf27">GitHub</a> · <a href="https://www.linkedin.com/in/samuel-ferreira27/">LinkedIn</a>
</p>
