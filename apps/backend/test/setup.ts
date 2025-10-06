import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test', override: false });

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/taskflow';
}
