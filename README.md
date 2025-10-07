# TaskFlow

Collaborative task management platform built with a NestJS + Prisma backend and a Vite + React frontend.

## Requirements

- Node.js 20.x
- pnpm 9.x
- Docker with Compose plugin

## Getting Started

1. Install dependencies: `pnpm install`
2. Copy environment templates:
   - `cp .env.example .env`
   - `cp apps/frontend/.env.example apps/frontend/.env`
3. Boot the local infrastructure: `docker compose up -d`
4. Generate the Prisma client: `pnpm db:generate`
5. Apply database migrations: `pnpm db:migrate`
6. Seed development data (creates a demo workspace and user): `pnpm db:seed`

Seed user credentials:

- Email: `founder@taskflow.dev`
- Password: `Password123!` (override with `SEED_USER_PASSWORD` when seeding)

## Running the Apps

- Backend API: `pnpm dev:backend` (serves on `http://localhost:3000/api`)
- Frontend app: `pnpm dev:frontend` (serves on `http://localhost:5173`)

## API Surface

- `POST /api/auth/register|login|refresh` – user authentication lifecycle.
- `GET /api/auth/me` – fetch the authenticated profile.
- `GET /api/projects` – list projects for the current user.
- `POST /api/projects` – create a new project owned by the caller.
- `GET /api/projects/:projectId` – retrieve a project with membership validation.
- `PATCH /api/projects/:projectId` – update project metadata (owner/admin roles only).
- `GET|POST /api/projects/:projectId/memberships` – list or invite members.
- `PATCH|DELETE /api/projects/:projectId/memberships/:membershipId` – adjust roles or remove members (owner/admin permissions enforced).
- `GET|POST /api/projects/:projectId/tasks` – browse or create tasks within a project (requires contributor+ roles for write).
- `GET|PATCH|DELETE /api/projects/:projectId/tasks/:taskId` – task lifecycle operations scoped to the project.

## Quality Gates

- Lint: `pnpm lint`
- Unit tests: `pnpm test`
- Type checks: `pnpm typecheck`

## Tooling Notes

- Local S3-compatible storage is provided through MinIO (exposed on `http://localhost:9000`).
- Update the `.env` files with production-ready secrets before deploying.
