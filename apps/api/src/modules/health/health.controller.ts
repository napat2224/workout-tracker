import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@workout/shared-types';

/**
 * Cheapest possible proof the web app is actually talking to this process.
 * `GET /api/health`
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }
}
