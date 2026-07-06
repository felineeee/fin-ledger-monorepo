import {
  Inject,
  Global,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { createClient, RedisClient } from 'redis';
import type { RedisClientType } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (ConfigService: ConfigService) => {
        const redisUrl = ConfigService.get<string>('REDIS_URL');
        return createClient({ url: redisUrl });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleInit, OnApplicationShutdown {
  constructor(
    @Inject(RedisClient) private readonly redisClient: RedisClientType,
  ) {}

  async onModuleInit() {
    await this.redisClient.connect();
  }
  async onApplicationShutdown(signal?: string) {
    await this.redisClient.destroy();
  }
}
