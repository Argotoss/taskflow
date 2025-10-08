import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { AppModule } from '../src/app.module';
import { createSwaggerDocument } from '../src/swagger.config';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.init();
  const document = createSwaggerDocument(app);
  const docsDir = path.resolve(process.cwd(), 'docs');
  const outputPath = path.join(docsDir, 'openapi.json');
  mkdirSync(docsDir, { recursive: true });

  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`Swagger spec written to ${outputPath}`);
}

void generate().catch((error) => {
  console.error('Failed to generate OpenAPI document', error);
  process.exitCode = 1;
});
