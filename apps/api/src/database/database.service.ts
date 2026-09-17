import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema.js';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly client: Sql;
  readonly db: PostgresJsDatabase<typeof schema>;

  constructor(config: ConfigService) {
    this.client = postgres(config.getOrThrow<string>('DATABASE_URL'), {
      max: config.get('NODE_ENV') === 'test' ? 1 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    this.db = drizzle(this.client, { schema });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.end();
  }
}
