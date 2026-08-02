import {
  Injectable,
  NotFoundException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Kysely } from 'kysely';
import { Xendit, PaymentRequest as PaymentRequestClient } from 'xendit-node';
import { DB } from '../../../db/types.js';
import { UpdateGatewayConfigDto } from '../dto/gateway-config.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

export interface XenditDbConfig {
  api_key?: string;
  webhook_token?: string;
  enabled_channels?: string[];
  public_key?: string;
  [key: string]: any;
}

export interface PaymentMethodRecord {
  id: string;
  name: string;
  type: 'CASH' | 'CARD' | 'WALLET' | 'VIRTUAL_ACCOUNT' | 'QRIS'; // There should'nt be 'CASH' here
  provider: string;
  is_active: boolean;
  config: XenditDbConfig;
}

@Injectable()
export class GatewayConfigService {
  private xenditClient!: Xendit;
  private paymentRequestClient!: PaymentRequestClient;
  private isEnabled: boolean = true;
  private secretKey: string;
  private webhookToken: string;

  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {
    this.secretKey = process.env.XENDIT_SECRET_KEY || '';
    this.webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || '';

    this.initializeClient();
  }

  private initializeClient(): void {
    if (!this.secretKey) {
      console.warn('XENDIT_SECRET_KEY is missing. Gateway features will fail.');
      return;
    }

    this.xenditClient = new Xendit({
      secretKey: this.secretKey,
    });
    this.paymentRequestClient = new PaymentRequestClient({
      secretKey: this.secretKey,
    });
  }

  // GET Client
  public getClient(): Xendit {
    if (!this.isEnabled) {
      throw new Error('Gateway is currently disabled.');
    }
    if (!this.xenditClient) {
      throw new Error('Xendit client is not configured.');
    }
    return this.xenditClient;
  }

  public getWebhookToken(): string {
    return this.webhookToken;
  }

  public getPaymentRequestClient(): PaymentRequestClient {
    if (!this.isEnabled) {
      throw new InternalServerErrorException('Gateway is currently disabled.');
    }
    if (!this.paymentRequestClient) {
      throw new InternalServerErrorException(
        'Xendit Payment Request client is not configured.',
      );
    }
    return this.paymentRequestClient;
  }

  public isGatewayEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Fetches the Xendit configuration stored inside the `payment_methods` DB table
   */
  public async getXenditDbConfig(): Promise<{
    id: string;
    config: XenditDbConfig;
    activeMethods: PaymentMethodRecord[];
  }> {
    // 1. Fetch all active payment methods managed by the 'XENDIT' provider
    const methods = await this.db
      .selectFrom('payment_methods')
      .selectAll()
      .where('name', '=', 'XENDIT')
      .where('is_active', '=', true)
      .execute();

    if (!methods || methods.length === 0) {
      throw new NotFoundException(
        'No active Xendit payment methods configured in payment_methods table.',
      );
    }

    // 2. Normalize JSON config fields
    const normalizedMethods: PaymentMethodRecord[] = methods.map((m) => ({
      ...m,
      config:
        typeof m.config === 'string'
          ? JSON.parse(m.config)
          : ((m.config || {}) as XenditDbConfig),
    }));

    const primaryMethod = normalizedMethods[0];

    return {
      id: primaryMethod.id,
      config: primaryMethod.config,
      activeMethods: normalizedMethods,
    };
  }

  /**
   * Fetches specific payment method metadata by type (e.g., 'WALLET', 'QRIS', 'VIRTUAL_ACCOUNT')
   */
  public async getPaymentMethodByType(
    type: 'CASH' | 'CARD' | 'WALLET' | 'VIRTUAL_ACCOUNT' | 'QRIS',
  ) {
    const method = await this.db
      .selectFrom('payment_methods')
      .selectAll()
      .where('type', '=', type)
      .where('provider', '=', 'XENDIT')
      .where('is_active', '=', true)
      .executeTakeFirst();

    if (!method) {
      throw new NotFoundException(
        `Payment method for ${type} via Xendit is not active or available.`,
      );
    }

    return {
      ...method,
      config:
        typeof method.config === 'string'
          ? JSON.parse(method.config)
          : method.config,
    };
  }

  /**
   * In-memory status summary (for internal monitoring/admin status views)
   */
  public async getConfigSummary() {
    return {
      provider: 'XENDIT',
      is_enabled: this.isEnabled,
      masked_key: this.secretKey ? `***${this.secretKey.slice(-4)}` : null,
      has_webhook_token: !!this.webhookToken,
    };
  }

  /**
   * Updates in-memory runtime credentials and reinitializes the Xendit client
   */
  public async updateRuntimeConfig(dto: UpdateGatewayConfigDto) {
    let reinitRequired = false;

    if (dto.secret_key !== undefined) {
      this.secretKey = dto.secret_key;
      reinitRequired = true;
    }

    if (dto.webhook_token !== undefined) {
      this.webhookToken = dto.webhook_token;
    }

    if (dto.is_enabled !== undefined) {
      this.isEnabled = dto.is_enabled;
    }

    if (reinitRequired) {
      this.initializeClient();
    }

    return this.getConfigSummary();
  }

  /**
   * GET /api/gateway-config
   */
  public async getGatewayConfig() {
    const method = await this.getXenditDbConfig();
    return {
      provider: 'Xendit',
      config: method.config,
    };
  }

  /**
   * PATCH /api/gateway-config
   */
  public async updateGatewayConfig(dto: UpdateGatewayConfigDto) {
    const method = await this.getXenditDbConfig();
    const updatedConfig = { ...method.config, ...dto };

    await this.db
      .updateTable('payment_methods')
      .set({ config: JSON.stringify(updatedConfig) })
      .where('id', '=', method.id)
      .execute();

    return { provider: 'Xendit', config: updatedConfig };
  }
}
