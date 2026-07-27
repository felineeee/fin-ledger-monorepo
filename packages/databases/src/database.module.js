"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const kysely_1 = require("kysely");
const database_constats_js_1 = require("./database.constats.js");
let DatabaseModule = class DatabaseModule {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async onModuleInit() {
        const client = await this.pool.connect();
        try {
            await client.query('SELECT 1');
        }
        finally {
            client.release();
        }
    }
    async onApplicationShutdown() {
        await this.pool.end();
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: database_constats_js_1.PG_POOL,
                useFactory: (ConfigService) => {
                    const connectionString = ConfigService.get('DATABASE_URL');
                    return new pg_1.Pool({
                        connectionString,
                        max: 25,
                        min: 5,
                        idleTimeoutMillis: 30000,
                        connectionTimeoutMillis: 5000,
                    });
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: database_constats_js_1.KYSELY_DB,
                useFactory: (pool) => {
                    return new kysely_1.Kysely({
                        dialect: new kysely_1.PostgresDialect({ pool }),
                    });
                },
                inject: [database_constats_js_1.PG_POOL],
            },
        ],
        exports: [database_constats_js_1.PG_POOL, database_constats_js_1.KYSELY_DB],
    }),
    __param(0, (0, common_1.Inject)(database_constats_js_1.PG_POOL)),
    __metadata("design:paramtypes", [pg_1.Pool])
], DatabaseModule);
