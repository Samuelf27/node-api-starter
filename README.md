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
  <img src="https://img.shields.io/badge/tests-14%20passing-34d399?style=flat"/>
</p>

---

## 📌 Sobre

Um ponto de partida **pronto para produção** para APIs Node.js — resolvendo as partes que toda empresa precisa e ninguém quer reescrever: autenticação, autorização por papéis, validação de entrada, documentação e testes. Arquitetura em camadas e **repositório plugável** (troque memória → PostgreSQL sem mexer nos serviços).

## ✨ O que vem pronto

- 🔑 **Autenticação JWT** com **access + refresh token**
- 🛡️ **RBAC** — autorização por papéis (`ADMIN`, `USER`)
- 🔒 Senhas com **bcrypt**
- ✅ **Validação** de entrada com **Zod** (erros 400 estruturados)
- 📚 **Swagger UI** em `/docs` (OpenAPI 3)
- 🧪 **14 testes de integração** (Vitest + Supertest)
- 🐳 **Docker** + **docker-compose** (com PostgreSQL)
- ⚙️ **CI** no GitHub Actions (typecheck + testes + build)
- 🧱 Arquitetura modular (config, lib, middleware, modules)

## 🔗 Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Cria conta (retorna tokens) |
| `POST` | `/api/auth/login` | — | Login (retorna tokens) |
| `POST` | `/api/auth/refresh` | — | Renova o access token |
| `GET` | `/api/auth/me` | Bearer | Dados do usuário logado |
| `GET` | `/api/users` | ADMIN | Lista usuários |
| `GET` | `/api/users/:id` | ADMIN | Detalhe |
| `PATCH` | `/api/users/:id` | ADMIN | Atualiza |
| `DELETE` | `/api/users/:id` | ADMIN | Remove |
| `GET` | `/health` · `/docs` | — | Status · Documentação |

## 🚀 Como rodar

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:3000  (docs em /docs)
npm test           # 14 testes de integração
npm run build      # bundle de produção (tsup)
```

🔑 Admin pré-cadastrado: **admin@example.com / admin123**

### Com Docker
```bash
docker compose up --build
```

### Exemplo
```bash
# login
curl -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

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
├── modules/auth/          # register, login, refresh, me
├── modules/users/         # CRUD com RBAC
└── docs/openapi.ts        # spec OpenAPI
```

## 📄 Licença

[MIT](LICENSE) © Samuel Ferreira

---

<p align="center">
  <a href="https://github.com/Samuelf27">GitHub</a> · <a href="https://www.linkedin.com/in/samuel-ferreira27/">LinkedIn</a>
</p>
