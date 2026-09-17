# Resulta — University Results Analyzer

A production-oriented academic results management and analytics platform rebuilt for the Faculty of Applied Sciences, Wayamba University of Sri Lanka.

The original 2023 course project proved the workflow. Version 2 replaces the EJS/Express/MySQL implementation with a type-safe, tested, maintainable monorepo built around NestJS, React, PostgreSQL, TanStack Router, TanStack Query, Tailwind CSS, and shadcn-style accessible components.

## What is implemented

- Student, lecturer, and administrator roles with deny-by-default authorization
- Argon2id passwords, short-lived JWT access tokens, rotated HTTP-only refresh cookies, logout revocation, and login throttling
- Normalized PostgreSQL schema and versioned Drizzle migrations
- Student/staff identity management and account lifecycle states
- Governed departments, programmes, modules, credits, levels, and semesters
- Result attempts with draft, published, and withheld states
- Student-safe result access: students can only read their own published records
- Deterministic credit-weighted GPA summaries and staff-level academic analytics
- Validated CSV result imports with idempotent upserts, row-level error reporting, and audit history
- Responsive administrative and student interface with typed routing and server-state caching
- OpenAPI documentation in non-production environments
- Health checks, Docker deployment, seed data, and GitHub Actions verification

## Technology

| Layer | Stack |
| --- | --- |
| Web | React 19, TypeScript 6, Vite 8, TanStack Router, TanStack Query, Tailwind CSS 4, Radix UI, Recharts |
| API | NestJS 12, TypeScript, Passport JWT, class-validator, OpenAPI |
| Data | PostgreSQL 18, Drizzle ORM and migrations |
| Security | Argon2id, rotated refresh tokens, Helmet, CORS allow-listing, request throttling, RBAC |
| Quality | Vitest, Oxlint, ESLint, strict TypeScript, reproducible pnpm workspace |
| Operations | Docker Compose, Nginx, health checks, GitHub Actions |

## Repository layout

```text
apps/
  api/                 NestJS API, schema, migrations, seed and tests
  web/                 React application and presentation system
docs/
  ARCHITECTURE.md      Boundaries, security decisions and domain rules
.github/workflows/     CI verification
docker-compose.yml     Local/production-like runtime
```

## Run locally

Requirements: Node.js 24+, pnpm 11+, and PostgreSQL 18+ (or Docker).

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open the web application at `http://localhost:5173` and API documentation at `http://localhost:3000/api/docs`.

Seed accounts use the value of `SEED_PASSWORD`:

- Administrator: `admin@wusl.ac.lk`
- Student: `student@wusl.ac.lk`

Change the seed password and all JWT secrets before any shared deployment.

## Run with containers

```bash
cp .env.example .env
docker compose up --build
```

The web application is served at `http://localhost:8080`. Compose applies versioned migrations before starting the API. To load local demonstration data once:

```bash
docker compose run --rm api node dist/database/seed.js
```

## CSV result contract

Required headers:

```csv
index_number,module_code,attempt,grade,marks,examination_year,status
UWU/CST/21/001,CMIS1113,1,A,75,2023,PUBLISHED
```

`attempt`, `marks`, and `status` are optional (`attempt=1`, `status=DRAFT`). An import is limited to 10,000 rows and 2 MB. Existing results are matched by student, module, attempt, and examination year.

## Quality gates

```bash
pnpm verify
```

This runs linting, strict type checking, tests, and production builds for every application. Run `pnpm db:generate` after an intentional schema change and commit the generated migration.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for security and domain decisions.
