// src/payments/webhooks.service.ts
import {
  Injectable,
  Headers,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class WebhooksService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  // Helper to fetch the Xendit Webhook Secret from our config
  private async getWebhookSecret() {
    const method = await this.db
      .selectFrom('payment_methods')
      .selectAll()
      .where('name', '=', 'Xendit Gateway')
      .executeTakeFirst();

    if (!method) return null;
    const config =
      typeof method.config === 'string'
        ? JSON.parse(method.config)
        : method.config;
    return config.webhook_secret;
  }

  // [x] POST /api/webhooks/gateway
  async handleGatewayWebhook(callbackToken: string, payload: any) {
    // 1. Verify Xendit Token
    const expectedToken = await this.getWebhookSecret();
    if (expectedToken && callbackToken !== expectedToken) {
      throw new UnauthorizedException('Invalid callback token');
    }

    const eventId = payload.id; // Xendit's unique event/invoice ID
    const externalId = payload.external_id; // This maps directly to our `payments.id`

    return this.db.transaction().execute(async (trx) => {
      // 2. Idempotency Check: Have we processed this specific webhook event before?
      const existingEvent = await trx
        .selectFrom('webhook_events')
        .selectAll()
        .where('event_id', '=', eventId)
        .executeTakeFirst();

      if (existingEvent) return { success: true, message: 'Already processed' };

      // 3. Log the Webhook
      await trx
        .insertInto('webhook_events')
        .values({
          event_id: eventId,
          payment_id: externalId || null,
          event_type: payload.status || 'UNKNOWN',
          payload: JSON.stringify(payload),
        })
        .execute();

      // 4. Process Payment State based on Xendit Status
      if (externalId && payload.status === 'PAID') {
        const payment = await trx
          .selectFrom('payments')
          .selectAll()
          .where('id', '=', externalId)
          .executeTakeFirst();

        if (payment && payment.status === 'PENDING') {
          // Update State
          await trx
            .updateTable('payments')
            .set({ status: 'CAPTURED', updated_at: sql`NOW()` })
            .where('id', '=', externalId)
            .execute();

          // Write Realization to Ledger
          await trx
            .insertInto('payment_ledger')
            .values({
              payment_id: externalId,
              entry_type: 'CAPTURED',
              amount: payment.amount,
              currency: payment.currency,
              metadata: JSON.stringify({
                xendit_invoice_id: eventId,
                channel: payload.payment_method,
              }),
            })
            .execute();
        }
      }

      if (externalId && payload.status === 'EXPIRED') {
        const payment = await trx
          .selectFrom('payments')
          .selectAll()
          .where('id', '=', externalId)
          .executeTakeFirst();
        if (payment && payment.status === 'PENDING') {
          await trx
            .updateTable('payments')
            .set({ status: 'FAILED', updated_at: sql`NOW()` })
            .where('id', '=', externalId)
            .execute();
        }
      }

      return { success: true };
    });
  }

  // [x] GET /api/webhooks/events
  async getWebhookEvents() {
    return this.db
      .selectFrom('webhook_events')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }

  // [x] GET /api/webhooks/events/:id
  async getWebhookEventDetails(id: string) {
    return this.db
      .selectFrom('webhook_events')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
  }
}
