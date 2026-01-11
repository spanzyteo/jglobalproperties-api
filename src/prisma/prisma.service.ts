import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const pool = new Pool({ connectionString }) as any;
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  //connect when module initializes
  async onModuleInit() {
    await this.$connect();
  }

  //disconnect when app shuts down
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
