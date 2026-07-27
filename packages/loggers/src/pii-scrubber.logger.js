"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiiScrubberLogger = void 0;
const common_1 = require("@nestjs/common");
let PiiScrubberLogger = class PiiScrubberLogger extends common_1.ConsoleLogger {
    piiKeys = new Set([
        'account_id',
        'target_account_id',
        'user_id',
        'senderUserId',
    ]);
    log(message, context) {
        const scrubbedMessage = this.processPayload(message);
        super.log(typeof scrubbedMessage === 'string'
            ? scrubbedMessage
            : JSON.stringify(scrubbedMessage), context);
    }
    error(message, stack, context) {
        const scrubbedMessage = this.processPayload(message);
        super.error(typeof scrubbedMessage === 'string'
            ? scrubbedMessage
            : JSON.stringify(scrubbedMessage), stack, context);
    }
    warn(message, context) {
        const scrubbedMessage = this.processPayload(message);
        super.warn(typeof scrubbedMessage === 'string'
            ? scrubbedMessage
            : JSON.stringify(scrubbedMessage), context);
    }
    processPayload(payload) {
        if (payload === null || payload === undefined) {
            return payload;
        }
        if (typeof payload !== 'object') {
            return payload;
        }
        if (Array.isArray(payload)) {
            return payload.map((item) => this.processPayload(item));
        }
        const scrubbedObj = {};
        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                const val = payload[key];
                if (this.piiKeys.has(key) && typeof val === 'string') {
                    scrubbedObj[key] = this.maskString(val);
                }
                else {
                    scrubbedObj[key] = this.processPayload(val);
                }
            }
        }
        return scrubbedObj;
    }
    maskString(val) {
        if (val.length <= 8) {
            return '********';
        }
        return `${val.substring(0, 4)}-****-${val.substring(val.length - 4)}`;
    }
};
exports.PiiScrubberLogger = PiiScrubberLogger;
exports.PiiScrubberLogger = PiiScrubberLogger = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT })
], PiiScrubberLogger);
