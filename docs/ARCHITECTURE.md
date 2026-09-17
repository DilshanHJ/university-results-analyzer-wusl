# Architecture

Resulta is a pnpm monorepo with a React single-page application and a modular NestJS API backed by PostgreSQL.

## Boundaries

- **Authentication** owns credentials, access tokens, rotated refresh tokens, login throttling, and account sessions.
- **Users** owns student/staff identity and account lifecycle. Password hashes are never returned by service projections.
- **Academic modules** owns departments, programmes, modules, credits, and semester placement.
- **Results** owns result attempts, publication state, CSV ingestion, GPA inputs, and mutation audit records.
- **Analytics** reads published result facts and produces role-appropriate summaries.
- **Health** provides an unauthenticated liveness/readiness endpoint.

## Security model

- Passwords use Argon2id through the `argon2` package.
- Access JWTs are short-lived and sent only in the `Authorization` header.
- Refresh JWTs are rotated and stored in an `HttpOnly`, `SameSite=Lax` cookie. Only a hash is retained in PostgreSQL.
- JWT authentication and role authorization are deny-by-default global guards. Public endpoints require explicit metadata.
- Students cannot choose a student ID when reading results; the API derives it from the authenticated principal.
- DTO validation rejects unknown fields, CORS is allow-listed, Helmet sets security headers, and login/refresh endpoints are throttled.
- Result mutations and imports create audit records.

## Result identity and GPA rules

A result is unique by student, module, attempt, and examination year. CSV imports upsert on that key. GPA is calculated only from `PUBLISHED` results using the database grade scale and module credits:

`GPA = sum(grade point × credits) / sum(credits)`

The pure calculation function is unit-tested and rounds only the final value to two decimals.

## Production evolution

Before institutional rollout, add SSO against the university identity provider, institution-approved grade regulations, backup/restore drills, object storage for import evidence, structured telemetry, and a formal data-retention policy. These are deployment/governance concerns and must not be guessed in source code.
