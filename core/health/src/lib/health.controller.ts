import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '@dual-dictionary/common';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
  }

  // Lightweight liveness ping for uptime pingers (e.g. cron-job.org).
  // Does not touch the database and returns a tiny, fixed-length body.
  @Get('ping')
  @Public()
  ping() {
    return { status: 'ok' };
  }
}
