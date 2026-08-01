// src/payments/gateway.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { Xendit } from 'xendit-node';
import { DB } from '../../db/types.js';
import {
  CreateCheckoutSessionDto,
  // UpdateGatewayConfigDto,
} from './dto/gateway.dto.js';
import { UpdateGatewayConfigDto } from './dto/gateway-config.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

// @TODO i might separate this gateway services into gateway-config service
@Injectable()
export class GatewayService {
  private xenditClient!: Xendit;
  private isEnabled: boolean = true;
  private secretKey: string;
  private webhookToken: string;

  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {
    this.secretKey = process.env.XENDIT_SECRET_KEY || '';
    this.webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || '';

    this.initializeClient();
  }

  private initializeClient() {
    if (!this.secretKey) {
      console.warn('XENDIT_SECRET_KEY is missing. Gateway features will fail.');
      return;
    }

    this.xenditClient = new Xendit({
      secretKey: this.secretKey,
    });
  }

  public getClient(): Xendit {
    if (!this.isEnabled)
      throw new InternalServerErrorException('Gateway is currently disabled.');
    if (!this.xenditClient)
      throw new InternalServerErrorException(
        'Xendit client is not configured.',
      );
    return this.xenditClient;
  }

  public getWebhookToken(): string {
    return this.webhookToken;
  }

  // Helper to fetch the Xendit config from the database
  private async getXenditConfig() {
    const method = await this.db
      .selectFrom('payment_methods')
      .selectAll()
      .where('name', '=', 'Xendit Gateway') // Assuming this is your registered gateway name
      .executeTakeFirst();

    if (!method)
      throw new NotFoundException(
        'Xendit Gateway configuration not found in payment_methods.',
      );
    return {
      id: method.id,
      config:
        typeof method.config === 'string'
          ? JSON.parse(method.config)
          : method.config,
    };
  }

  async getConfig() {
    return {
      provider: 'XENDIT',
      is_enabled: this.isEnabled,
      masked_key: this.secretKey ? `***${this.secretKey.slice(-4)}` : null,
      has_webhook_token: !!this.webhookToken,
    };
  }

  async updateConfig(dto: UpdateGatewayConfigDto) {
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

    return this.getConfig();
  }

  // [x] POST /api/payments/:id/create-checkout-session
  async createCheckoutSession(
    paymentId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment)
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    if (payment.channel !== 'ONLINE')
      throw new ConflictException(
        'Checkout sessions are only for ONLINE payments.',
      );
    if (payment.status !== 'PENDING')
      throw new ConflictException(`Payment is already ${payment.status}.`);

    const { config } = await this.getXenditConfig();
    if (!config?.api_key)
      throw new ConflictException('Gateway API Key is not configured.');

    // Construct Xendit Invoice Payload
    const payload = {
      external_id: payment.id, // Links Xendit directly to our internal ID
      amount: Number(payment.amount),
      currency: payment.currency,
      success_redirect_url: dto.success_redirect_url,
      failure_redirect_url: dto.failure_redirect_url,
      payment_methods: config.enabled_channels || [
        'CREDIT_CARD',
        'VIRTUAL_ACCOUNT',
        'QRIS',
        'EWALLET',
        'PAYLATER',
      ],
    };

    // Call Xendit API
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(config.api_key + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new ConflictException(
        `Failed to create Xendit checkout session: ${err.message}`,
      );
    }

    const xenditInvoice = await response.json();

    return {
      payment_id: payment.id,
      checkout_url: xenditInvoice.invoice_url,
      expires_at: xenditInvoice.expiry_date,
      status: xenditInvoice.status,
    };
  }

  // [x] GET /api/payments/:id/checkout-session
  async getCheckoutSession(paymentId: string) {
    const { config } = await this.getXenditConfig();

    // Fetch the invoice state directly from Xendit using external_id
    const response = await fetch(
      `https://api.xendit.co/v2/invoices?external_id=${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(config.api_key + ':').toString('base64')}`,
        },
      },
    );

    const invoices = await response.json();
    if (!invoices || invoices.length === 0) {
      throw new NotFoundException(
        `No active checkout session found for payment ${paymentId}`,
      );
    }

    // Return the most recent invoice for this external_id
    return invoices[0];
  }

  // [x] POST /api/payments/:id/retry
  async retryCheckoutSession(paymentId: string, dto: CreateCheckoutSessionDto) {
    // 1. Expire the old invoice in Xendit if it exists
    await this.cancelCheckoutSession(paymentId, true); // true = soft cancel (don't void the DB record)

    // 2. Generate a fresh session link
    return this.createCheckoutSession(paymentId, dto);
  }

  // [x] POST /api/payments/:id/cancel-checkout-session
  async cancelCheckoutSession(paymentId: string, isRetry = false) {
    const session = await this.getCheckoutSession(paymentId);
    const { config } = await this.getXenditConfig();

    if (session.status === 'PENDING') {
      // Force expire the invoice on Xendit
      await fetch(`https://api.xendit.co/invoices/${session.id}/expire!`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(config.api_key + ':').toString('base64')}`,
        },
      });
    }

    if (isRetry) return { success: true, message: 'Old session expired.' };

    // If completely canceling, update our internal state and ledger
    return this.db.transaction().execute(async (trx) => {
      const payment = await trx
        .selectFrom('payments')
        .selectAll()
        .where('id', '=', paymentId)
        .executeTakeFirstOrThrow();

      const updated = await trx
        .updateTable('payments')
        .set({ status: 'VOIDED', updated_at: sql`NOW()` })
        .where('id', '=', paymentId)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('payment_ledger')
        .values({
          payment_id: paymentId,
          entry_type: 'VOIDED',
          amount: sql`${payment.amount} * -1`,
          currency: payment.currency,
        })
        .execute();

      return updated;
    });
  }

  // [x] GET /api/gateway-config
  async getGatewayConfig() {
    const method = await this.getXenditConfig();
    return {
      provider: 'Xendit',
      config: method.config,
    };
  }

  // [x] PATCH /api/gateway-config
  async updateGatewayConfig(dto: UpdateGatewayConfigDto) {
    const method = await this.getXenditConfig();
    const updatedConfig = { ...method.config, ...dto };

    await this.db
      .updateTable('payment_methods')
      .set({ config: JSON.stringify(updatedConfig) })
      .where('id', '=', method.id)
      .execute();

    return { provider: 'Xendit', config: updatedConfig };
  }
}
