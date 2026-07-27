import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
export declare class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
    private readonly pool;
    constructor(pool: Pool);
    onModuleInit(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
}
