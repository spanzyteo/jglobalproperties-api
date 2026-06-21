import { Injectable } from '@nestjs/common';

@Injectable()
export class CronJobService {
  getCronJob(): string {
    return 'PONG';
  }
}
