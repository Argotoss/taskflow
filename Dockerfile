FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

WORKDIR /app/apps/backend
RUN pnpm install --frozen-lockfile

WORKDIR /app
COPY . .

WORKDIR /app/apps/backend
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" pnpm exec prisma generate
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
