import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly skipDbConnection: boolean;

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const nodeEnv = configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const isTestEnv = nodeEnv === 'test' || process.env.JEST_WORKER_ID !== undefined;
    const resolvedUrl =
      databaseUrl ?? 'postgresql://placeholder:placeholder@localhost:5432/taskflow';

    if (!databaseUrl && !isTestEnv) {
      throw new Error('DATABASE_URL is not configured');
    }

    super({
      datasources: {
        db: {
          url: resolvedUrl,
        },
      },
      log: ['error', 'warn'],
    });

    this.skipDbConnection = isTestEnv && !databaseUrl;
  }

  async onModuleInit(): Promise<void> {
    if (this.skipDbConnection) {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.skipDbConnection) {
      return;
    }

    await this.$disconnect();
  }
}
