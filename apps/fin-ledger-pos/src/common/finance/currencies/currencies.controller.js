var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { CurrenciesService } from './currencies.service.js';
let CurrenciesController = class CurrenciesController {
    currenciesService;
    constructor(currenciesService) {
        this.currenciesService = currenciesService;
    }
    async getCurrencies() {
        return this.currenciesService.getCurrencies();
    }
    async getExchangeRates() {
        return this.currenciesService.getExchangeRates();
    }
};
__decorate([
    Get('currencies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CurrenciesController.prototype, "getCurrencies", null);
__decorate([
    Get('exchange-rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CurrenciesController.prototype, "getExchangeRates", null);
CurrenciesController = __decorate([
    Controller('currencies'),
    __metadata("design:paramtypes", [CurrenciesService])
], CurrenciesController);
export { CurrenciesController };
