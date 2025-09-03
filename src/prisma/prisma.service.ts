import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  //connect when module initializes
  async onModuleInit() {
    await this.$connect();
  }

  //disconnect when app shuts down
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
