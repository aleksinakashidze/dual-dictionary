# CLAUDE.md — dual-dictionary

## 1. Project Overview

- **Name:** `@dual-dictionary/source` (DualDictionary backend)
- **Purpose:** REST API powering the DualDictionary product — an English ↔ Georgian dictionary used by a browser extension and mobile clients.
- **Main functionality:** word search/translation, user accounts, personal study lists, quizzes (learning practice), feedback collection, and an internal admin API.

## 2. Tech Stack

- **Runtime / Framework:** Node.js (Node types `20.19.9`), NestJS **v11** (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`).
- **Language / Build:** TypeScript `^6`, SWC, Webpack via `@nx/webpack`.
- **Monorepo:** Nx **22.6.5** (`@nx/nest`, `@nx/node`, `@nx/js`, `@nx/jest`, `@nx/eslint`).
- **Database / ODM:** **MongoDB 7** with **Mongoose 9** (`@nestjs/mongoose`).
- **Auth:** JWT (`@nestjs/jwt`, `passport-jwt`) + access/refresh tokens, refresh token cookie, Google OAuth 2.0 (`passport-google-oauth20`) with mobile flow, `bcrypt` hashing.
- **Validation / Config:** `class-validator`, `class-transformer`, `joi` env schema, `@nestjs/config`.
- **Security / Hardening:** `helmet`, `compression`, `cookie-parser`, `@nestjs/throttler` (default + strict tiers).
- **Docs / Health:** `@nestjs/swagger` (served at `/docs`), `@nestjs/terminus`.
- **i18n:** `nestjs-i18n` (English/Georgian translations under `apps/api/src/i18n`).
- **Logging:** `winston` + `nest-winston` (`AppLogger`).
- **Mail / Storage:** `nodemailer` (SMTP), `@aws-sdk/client-s3` + `s3-request-presigner`.
- **Queues:** None (no BullMQ/Redis at present).
- **Testing:** Jest 30, `@nestjs/testing`, `ts-jest`.
- **Lint / Format:** ESLint 9 (`typescript-eslint`), Prettier 3 (`singleQuote: true`).

## 3. Architecture

Nx workspace with two NestJS applications consuming shared `core/*` and `modules/*` libraries via TS path aliases (e.g. `@dual-dictionary/auth`).

```
apps/                  Two runnable NestJS apps + their e2e projects
  api/                 Public REST API (port 3000, prefix /api, URI versioning)
  api-e2e/             e2e tests for api
  admin-api/           Internal admin REST API (port 3001)
  admin-api-e2e/       e2e tests for admin-api
core/                  Cross-cutting libraries (no domain logic)
  common/              Guards, interceptors, filters, pipes, decorators, mail, storage (S3), hash
  config/              AppConfigService + Joi env schema
  database/            Mongoose connection, BaseSchema, BaseRepository
  health/              Terminus health module
  i18n/                nestjs-i18n setup
  logger/              Winston-based AppLogger
  swagger/             setupSwagger() helper
modules/               Domain libraries (Nx libs, imported by both apps)
  auth/                JWT + Google OAuth, register/login/refresh/logout, password reset, email verify, account recovery
  users/               User schema, profile, account deletion/recovery
  dictionary/          Word schema/repo, autocomplete search (en-ka / ka-en)
  study-list/          User's saved-words list
  quiz/                Practice/quiz logic over study list
  feedback/            User feedback collection
dist/                  Build output (apps/api, apps/admin-api)
Dockerfile.api         Image for the public API
Dockerfile.admin-api   Image for the admin API
docker-compose.yml     Local stack: mongo + api + admin-api
railway.json           Railway deployment config (both services)
```

**Key design decisions:**
- TS path aliases in `tsconfig.base.json` instead of relative imports between libs.
- URI versioning (`/api/v1/...`) — every route uses `@Version('1')`.
- Global guards, filters, interceptors are wired in `apps/api/src/main.ts` (`JwtAuthGuard` + `RolesGuard` are global; routes opt out with `@Public()`).
- Throttling configured globally with `default` (100/min) and `strict` (per-route, e.g. login 10/min, forgot-password 3/min).
- Refresh tokens are returned both in body (for native/mobile) and in an HTTP-only cookie (web).

## 4. Setup Instructions

**Install:**
```sh
npm install
```

**Environment:** copy `.env.example` to `.env` and fill values. Variable names defined in `.env.example`:

- App: `NODE_ENV`, `PORT`, `ADMIN_PORT`
- MongoDB: `MONGODB_URI`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- CORS: `CORS_ORIGINS` (comma-separated)
- Mail (optional): `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- AWS S3 (optional): `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- Web: `WEB_APP_URL`

> Note: Google OAuth env keys (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`) are consumed by `AppConfigService` but are NOT in `.env.example` yet — add them locally if enabling Google login.

**Run dev:**
```sh
npx nx serve api          # public API   → http://localhost:3000/api  (Swagger /docs)
npx nx serve admin-api    # admin API    → http://localhost:3001/api
```

**Build / lint / test:**
```sh
npx nx build api
npx nx lint api
npx nx test api
```

**Docker (full local stack — mongo + both apps):**
```sh
docker compose up --build
```

**Deployment:** Railway, two services configured in `railway.json` using `Dockerfile.api` and `Dockerfile.admin-api`, both with healthcheck `/api`.

## 5. API / Features

All routes are prefixed `/api/v1`. Global JWT guard is on; endpoints are public only when decorated with `@Public()`.

**Public API (`apps/api`)** — controllers live in `modules/*/src/lib/controllers/` and are aggregated under `apps/api/src/modules/*/`:
- `auth/*` — `register`, `login`, `refresh`, `logout`, `forgot-password`, `validate-reset-token`, `reset-password`, `verify-email`, `resend-verification-email`, `me`, Google OAuth (`google`, `google/callback`, `google/mobile-init`, `google/mobile`), `account-recovery`.
- `dictionary/search` — autocomplete word search, `direction=en-ka|ka-en`, min 3 chars, throttled 30/min.
- `study-list/*` — manage saved words.
- `quiz/*` — practice over the user's study list.
- `feedback/*` — submit feedback.
- `health` — Terminus health check (used by Railway).

**Admin API (`apps/admin-api`)** — internal endpoints for `dictionary`, `users`, `feedback` management.

**Authentication flow:**
1. Client calls `POST /auth/register` or `/auth/login` → receives `{ user, tokens: { accessToken, refreshToken } }`. Refresh token also set as HTTP-only cookie.
2. Subsequent requests send `Authorization: Bearer <accessToken>`. `JwtAuthGuard` is global; `@Public()` opts out.
3. When access token expires, client calls `POST /auth/refresh` (cookie or body) — `RefreshTokenGuard` validates and rotates tokens.
4. `POST /auth/logout` invalidates the refresh token server-side and clears the cookie.
5. Google OAuth: web uses redirect callback to `WEB_APP_URL`; mobile uses `dualdictionary://` deep-link or `POST /auth/google/mobile` with an ID token.

## 6. Development Guidelines

- **Naming:** NestJS convention — `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`, `*.repository.ts`, `*.dto.ts`, `*.guard.ts`, `*.strategy.ts`. Library entry exports go through `modules/<name>/src/index.ts`.
- **Imports:** prefer path aliases (`@dual-dictionary/*`) over relative paths between libs.
- **DTOs:** every endpoint uses a class-validator DTO; global `globalValidationPipe` is enabled (whitelist + transform).
- **Versioning:** every controller method must declare `@Version('1')` (URI versioning is required, no default version).
- **Throttling:** sensitive routes use `@Throttle({ strict: { limit, ttl } })`.
- **Lint / format:** `eslint.config.mjs` (flat config) + Prettier `singleQuote: true`. Run `npx nx lint <project>` before committing.
- **Tests:** colocated `*.spec.ts`; `passWithNoTests: true` is enabled per project.
- **Commits:** no enforced convention in repo; default branch is `master` (`nx.json` → `defaultBase: master`). Conventional Commits style is recommended.

## 7. Important Notes

- **README.md is mostly Nx boilerplate** plus a small privacy notice — this `CLAUDE.md` is the authoritative source.
- **No queue/cache layer** (no Redis/BullMQ). Email sending is synchronous via SMTP.
- **`error.log` / `logs/`** are committed-looking artifacts at the repo root; these are runtime outputs and should not be edited.
- **Google OAuth env vars are missing from `.env.example`** — Google flows throw `ServiceUnavailableException` if `googleClientId` is not configured. Add them when enabling.
- **Two apps, one codebase:** changes to `modules/*` or `core/*` impact both `api` and `admin-api`. Always check both consumers.
- **MongoDB indexes** live inside `*.schema.ts` files in each module — review when adding queryable fields (especially `dictionary` for autocomplete performance).
- **Dockerfile** (root, no suffix) appears to be a leftover; deployments use `Dockerfile.api` / `Dockerfile.admin-api`.
- **`.env`, `.env.production`, `.env.test`** exist locally — never commit real secrets and never paste their contents into docs/PRs.

## 🔴 Maintenance Rule (Mandatory)

> ANYONE who reviews, modifies, or extends this project MUST update this `CLAUDE.md` file if the changes affect:
> - architecture
> - functionality
> - setup process
> - dependencies
> - or any documented behavior
>
> This is NOT optional. Keeping this file up to date is a REQUIRED part of the development process.

## 🤖 AI Efficiency Note

> This file is the SINGLE SOURCE OF TRUTH for AI assistants (e.g., Claude Code).
> It must be written so that an AI can begin working on this project immediately,
> without scanning any other files. Prioritize:
> - What the project does (not how every line is written)
> - Where the important logic lives
> - What to avoid or be careful about
> - What is incomplete or broken
>
> Keep this file under 200 lines. Conciseness saves tokens.
