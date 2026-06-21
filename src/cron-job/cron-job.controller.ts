import { Controller, Get } from '@nestjs/common';
import { CronJobService } from './cron-job.service';

@Controller('/ping')
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @Get()
  getCronJob(): string {
    return this.cronJobService.getCronJob();
  }
}
