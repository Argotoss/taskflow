import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test', override: false });

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/taskflow';
}

process.env.JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET ?? 'test-access-secret';
process.env.JWT_ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TOKEN_TTL ?? '900s';
process.env.JWT_REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_TOKEN_SECRET ?? 'test-refresh-secret';
process.env.JWT_REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TOKEN_TTL ?? '7d';
