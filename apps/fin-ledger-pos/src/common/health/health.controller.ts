import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Kysely, sql } from 'kysely';
import { DB } from '../../db/types.js';

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly db: Kysely<DB>) {}

  @Get()
  @ApiOperation({ summary: 'Check API and Database health status' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unreachable' })
  async check() {
    try {
      await sql`SELECT 1`.execute(this.db);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      });
    }
  }
}
