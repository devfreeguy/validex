import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Composes (rather than extends) PrismaClient: the Prisma 7 "prisma-client"
 * generator types the class behind a generic constructor signature that
 * TypeScript cannot carry through a `class X extends PrismaClient` clause
 * (its instance methods, e.g. $connect, disappear on the subclass), so the
 * client is held as a property instead.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly client: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    this.client = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', () => {
      void app.close();
    });
  }
}
