FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/pnpm-lock.yaml ./apps/backend/

WORKDIR /app/apps/backend
RUN pnpm install --frozen-lockfile

WORKDIR /app
COPY . .

WORKDIR /app/apps/backend
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
