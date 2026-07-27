import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import type { RedisClientType } from 'redis';
export declare class RedisModule implements OnModuleInit, OnApplicationShutdown {
    private readonly redisClient;
    constructor(redisClient: RedisClientType);
    onModuleInit(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
}
