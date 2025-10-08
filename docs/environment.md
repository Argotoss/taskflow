# Environment Configuration

This project keeps runtime configuration in two `.env` files: one at the repo root for the NestJS backend and one inside `apps/frontend` for the Vite client. Copy the provided `.env.example` files before running the stack and override the defaults as needed for your deployment targets.

## Backend (`.env`)

| Variable                     | Required             | Default                                                                | Description                                                            |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`                   | No                   | `development`                                                          | Runtime mode for NestJS and Prisma; tests override this automatically. |
| `PORT`                       | No                   | `3000`                                                                 | HTTP port the API listens on.                                          |
| `CLIENT_URL`                 | Yes                  | `http://localhost:5173`                                                | Origin allowed through CORS and used by auth cookies.                  |
| `API_URL`                    | Yes                  | `http://localhost:3000/api`                                            | Base URL surfaced to the frontend for API calls.                       |
| `DATABASE_URL`               | Yes                  | `postgresql://taskflow:taskflow@localhost:5432/taskflow?schema=public` | Connection string consumed by Prisma.                                  |
| `JWT_ACCESS_TOKEN_SECRET`    | Yes                  | _(none)_                                                               | Strong secret for signing access tokens.                               |
| `JWT_ACCESS_TOKEN_TTL`       | No                   | `900s`                                                                 | Access-token lifetime (supports `ms` syntax).                          |
| `JWT_REFRESH_TOKEN_SECRET`   | Yes                  | _(none)_                                                               | Strong secret for signing refresh tokens.                              |
| `JWT_REFRESH_TOKEN_TTL`      | No                   | `7d`                                                                   | Refresh-token lifetime; keep long enough to survive browser sessions.  |
| `AWS_REGION`                 | Yes (object storage) | `eu-central-1`                                                         | Region passed to the S3 client.                                        |
| `AWS_S3_BUCKET`              | Yes (object storage) | `taskflow-local`                                                       | Bucket storing attachments.                                            |
| `AWS_S3_PUBLIC_URL`          | Yes (object storage) | `http://localhost:9000/taskflow-local`                                 | Base URL the frontend uses to render uploaded files.                   |
| `AWS_S3_ENDPOINT`            | No                   | `http://localhost:9000`                                                | Custom endpoint for S3-compatible providers (MinIO, LocalStack).       |
| `AWS_ACCESS_KEY_ID`          | Yes (object storage) | `taskflow`                                                             | Credentials for S3/MinIO access.                                       |
| `AWS_SECRET_ACCESS_KEY`      | Yes (object storage) | `taskflow-secret`                                                      | Credentials for S3/MinIO access.                                       |
| `SEED_USER_PASSWORD`         | No                   | `Password123!`                                                         | Seeded owner password; override in any shared environment.             |
| `SEED_COLLABORATOR_PASSWORD` | No                   | `Password123!`                                                         | Seeded collaborator password; override in any shared environment.      |

### Local MinIO vs. AWS S3

- **Local development:** `docker compose up -d` boots MinIO on `http://localhost:9000`. Keep the defaults above so uploads hit the local bucket.
- **Production / cloud:** Point `AWS_REGION`, bucket, and credentials at your AWS (or S3-compatible) account, then update `AWS_S3_PUBLIC_URL` to the CDN or bucket URL end users will hit. Remove the MinIO service from `docker-compose.yml` in your deployment manifests.

## Frontend (`apps/frontend/.env`)

| Variable        | Required | Default                     | Description                                                      |
| --------------- | -------- | --------------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`  | Yes      | `http://localhost:3000/api` | REST endpoint the React client calls; match your backend origin. |
| `VITE_APP_NAME` | No       | `TaskFlow`                  | Branding string surfaced in the UI.                              |

> After editing environment files, restart affected services so the new configuration is picked up.
