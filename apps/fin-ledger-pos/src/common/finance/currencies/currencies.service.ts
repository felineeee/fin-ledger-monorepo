import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';

@Injectable()
export class CurrenciesService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] GET /api/currencies & /api/exchange-rates
  async getCurrencies() {
    return [
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
    ];
  }

  async getExchangeRates() {
    return { base: 'IDR', rates: { USD: 0.000062 } }; // Mocked static rates for boilerplate
  }
}
