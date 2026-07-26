import { Controller, Get } from '@nestjs/common';
import { CurrenciesService } from './currencies.service.js';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get('currencies')
  async getCurrencies() {
    return this.currenciesService.getCurrencies();
  }

  @Get('exchange-rates')
  async getExchangeRates() {
    return this.currenciesService.getExchangeRates();
  }
}
