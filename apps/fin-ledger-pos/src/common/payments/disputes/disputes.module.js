var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service.js';
import { DisputesController } from './disputes.controller.js';
let DisputesModule = class DisputesModule {
};
DisputesModule = __decorate([
    Module({
        controllers: [DisputesController],
        providers: [DisputesService],
    })
], DisputesModule);
export { DisputesModule };
