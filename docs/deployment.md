# Deployment Playbook

The stack runs cleanly on a managed Postgres instance, a single NestJS container, and a static host for the Vite build. Below is a pragmatic production setup plus a fully managed alternative when you need to move fast.

## Preferred stack (AWS)

### 1. Infrastructure

- **Backend container:** Build the backend Docker image (`pnpm --filter backend build && docker build`). Deploy it to ECS Fargate or a small EC2 instance. Point it at the environment variables below.
- **Database:** Provision Amazon RDS (PostgreSQL 16). Enable automated backups and set a rotation window.
- **Storage:** Create an S3 bucket for attachments. Enable public-read for the specific prefix you expose via presigned URLs or serve through CloudFront.
- **Frontend:** Build the Vite app (`pnpm --filter frontend build`) and upload `apps/frontend/dist` to S3 + CloudFront, or deploy to Cloudflare Pages/Vercel.
- **Secrets:** Store JWT secrets, database credentials, and S3 keys in AWS Secrets Manager or SSM Parameter Store. Inject them with ECS task definitions or EC2 systemd files.

### 2. Configuration

Use the values from `.env.example` as a template. Key production overrides:

- `DATABASE_URL` uses the RDS connection string.
- `CLIENT_URL` and `API_URL` point at your production domains (HTTPS).
- Swap the MinIO defaults (`AWS_*`) for your production bucket and credentials.
- Rotate `JWT_*_SECRET` values with high-entropy strings.
- Set `NODE_ENV=production` and `PORT` to match your load balancer target.

### 3. CI/CD

- Extend `.github/workflows/ci.yml` with a deploy job that runs after `validate` on `main` tags.
- Sample step for ECS: build/push the backend image, then call `aws ecs update-service --force-new-deployment`.
- Sample step for the frontend: run `pnpm --filter frontend build` and sync the build directory to S3 (`aws s3 sync apps/frontend/dist s3://<bucket>`).

## Fast path (managed platforms)

If you need a live demo quickly:

- **Backend:** Deploy to Railway or Render using the provided Dockerfile (or Yarn/PNPM buildpack). Configure environment variables through their dashboard and add the managed Postgres add-on.
- **Frontend:** Deploy to Cloudflare Pages, Netlify, or Vercel with `pnpm --filter frontend build` as the build command and `apps/frontend/dist` as the output directory. Set `VITE_API_URL` to the deployed backend URL.
- **File storage:** Keep MinIO for demo purposes by hosting it on Railway/Render, or switch to an AWS S3 bucket and update the environment variables accordingly.

### Minimum acceptable production checklist

- HTTPS in front of both frontend and API (CloudFront/ALB/Render TLS).
- Auto-updated dependencies via Dependabot or Renovate.
- Monitoring: enable CloudWatch metrics/logs or Render/Railway dashboards; optionally plug in Sentry for frontend + backend.
- Backups: enable RDS automatic backups or Render snapshots.
- Secrets rotation policy documented (90 days minimum).

## Smoke test after deploy

1. Run migrations: `pnpm db:migrate` (or the equivalent Prisma command in your CI/CD).
2. Seed initial data only in staging or with overrides for passwords.
3. Log in with the founder account and complete: create project → add task → upload attachment → move it on the kanban board.
4. Confirm `/api/docs` renders with your production domain.
