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
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
const redis_constants_js_1 = require("./redis.constants.js");
let RedisModule = class RedisModule {
    redisClient;
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    async onModuleInit() {
        await this.redisClient.connect();
    }
    async onApplicationShutdown() {
        if (this.redisClient.isOpen) {
            await this.redisClient.quit();
        }
    }
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: redis_constants_js_1.REDIS_CLIENT,
                useFactory: (configService) => {
                    const redisUrl = configService.get('REDIS_URL', 'redis://localhost:6379');
                    return (0, redis_1.createClient)({ url: redisUrl });
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [redis_constants_js_1.REDIS_CLIENT],
    }),
    __param(0, (0, common_1.Inject)(redis_constants_js_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Object])
], RedisModule);
