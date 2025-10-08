# Contributing

Thanks for taking the time to help TaskFlow improve. Follow the workflow below to keep the codebase healthy and reviews fast.

## Prerequisites

- Node.js 20.x with pnpm 9.x (`corepack enable` recommended).
- Docker + Compose for the local Postgres and MinIO services.
- Run `pnpm install` once at the repo root; workspace dependencies are hoisted.

## Local setup

1. Copy environment templates: `.env.example` → `.env`, `apps/frontend/.env.example` → `apps/frontend/.env`.
2. Start infrastructure: `docker compose up -d`.
3. Generate Prisma client and run migrations: `pnpm db:generate && pnpm db:migrate`.
4. Seed demo data when needed: `pnpm db:seed`.

## Branch & commit style

- Branch from `main` using `type/short-description` (e.g. `feat/projects-pagination`).
- Commits follow the existing convention (`feat:`, `fix:`, `docs:`, `chore:`). Keep messages imperative and scoped.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before pushing. The GitHub Actions pipeline runs the same checks.

## Code quality

- Backend: keep NestJS providers injectable, prefer DTOs for request validation, and reuse existing guards/interceptors.
- Frontend: align with existing component patterns (functional components, hooks, Zod validators).
- Add or update tests alongside changes: unit for service/controller logic, e2e for API flows, Vitest or React Testing Library for UI.
- Update `docs/openapi.json` via `pnpm docs:openapi` whenever the API contract changes.

## Pull request checklist

- [ ] Description outlines intent and includes screenshots/GIFs for UI changes.
- [ ] CI pipeline passes (`ci` badge shows green).
- [ ] Documentation updated (`README`, `docs/`, or inline comments) if behaviour changes.
- [ ] Reviewer instructions provided for any manual verification steps.

Once your PR is ready, request review from a maintainer. Thanks again for contributing!
