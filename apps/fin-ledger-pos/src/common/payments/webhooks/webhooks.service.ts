// src/payments/webhooks.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import { KYSELY_DB } from '@fin-ledger/databases';
import { FeesService } from '../../finance/fees/fees.service.js';

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<DB>,
    private readonly feesService: FeesService,
  ) {}

  // Helper to fetch the Xendit Webhook Secret from config
  private async getWebhookSecret(): Promise<string | null> {
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

    return config?.webhook_secret || null;
  }

  // Helper to extract our internal payment UUID across different Xendit webhook shapes
  private extractPaymentId(payload: any): string | null {
    // 1. Unified Payment Request API / E-Wallets / QRIS (v2+)
    if (payload.data?.reference_id) return payload.data.reference_id;
    if (payload.data?.qr_code?.external_id)
      return payload.data.qr_code.external_id;

    // 2. Legacy Virtual Accounts & Direct Invoices
    if (payload.external_id) return payload.external_id;
    if (payload.reference_id) return payload.reference_id;

    return null;
  }

  // Helper to check if event denotes payment success
  private isSuccessEvent(eventType: string, payload: any): boolean {
    const status = payload.status || payload.data?.status;

    return (
      status === 'PAID' ||
      status === 'SUCCEEDED' ||
      eventType === 'virtual_account.paid' ||
      eventType === 'qr.payment' ||
      eventType === 'payment_request.succeeded'
    );
  }

  // Helper to check if event denotes failure/expiration
  private isFailedEvent(eventType: string, payload: any): boolean {
    const status = payload.status || payload.data?.status;

    return (
      status === 'EXPIRED' ||
      status === 'FAILED' ||
      eventType === 'payment_request.failed'
    );
  }

  // [x] POST /api/webhooks/gateway
  async handleGatewayWebhook(
    callbackToken: string,
    eventType: string,
    payload: any,
  ) {
    // 1. Verify Xendit Token
    const expectedToken = await this.getWebhookSecret();
    if (expectedToken && callbackToken !== expectedToken) {
      throw new UnauthorizedException('Invalid callback token');
    }

    const eventId = payload.id || payload.event_id || `ev_${Date.now()}`;
    const paymentId = this.extractPaymentId(payload);

    return this.db.transaction().execute(async (trx) => {
      // 2. Idempotency Check: Have we logged this event?
      const existingEvent = await trx
        .selectFrom('webhook_events')
        .selectAll()
        .where('event_id', '=', eventId)
        .executeTakeFirst();

      if (existingEvent) {
        return { success: true, message: 'Already processed' };
      }

      // 3. Log Raw Webhook
      await trx
        .insertInto('webhook_events')
        .values({
          event_id: eventId,
          payment_id: paymentId || null,
          event_type: eventType || payload.status || 'UNKNOWN',
          payload: JSON.stringify(payload),
        })
        .execute();

      if (!paymentId) {
        return {
          success: true,
          message: 'Webhook logged without payment ID mapping',
        };
      }

      // 4. Lock & Select Payment Row to avoid race conditions
      const payment = await trx
        .selectFrom('payments')
        .selectAll()
        .where('id', '=', paymentId)
        .forUpdate()
        .executeTakeFirst();

      if (!payment || payment.status === 'CAPTURED') {
        return {
          success: true,
          message: 'Payment not found or already captured',
        };
      }

      // 5. Handle Payment SUCCESS
      if (
        this.isSuccessEvent(eventType, payload) &&
        payment.status === 'PENDING'
      ) {
        // Update Payment Status
        await trx
          .updateTable('payments')
          .set({ status: 'CAPTURED', updated_at: sql`NOW()` })
          .where('id', '=', payment.id)
          .execute();

        // Write Realization to Ledger
        await trx
          .insertInto('payment_ledger')
          .values({
            payment_id: payment.id,
            entry_type: 'CAPTURED',
            amount: payment.amount,
            currency: payment.currency || 'IDR',
            metadata: JSON.stringify({
              source: 'webhook',
              event_id: eventId,
              channel:
                payload.payment_method || payload.data?.payment_method?.type,
            }),
          })
          .execute();
      }

      // 6. Handle Payment FAILURE / EXPIRED
      if (
        this.isFailedEvent(eventType, payload) &&
        payment.status === 'PENDING'
      ) {
        await trx
          .updateTable('payments')
          .set({ status: 'FAILED', updated_at: sql`NOW()` })
          .where('id', '=', payment.id)
          .execute();
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
      .limit(50)
      .execute();
  }

  // [x] GET /api/webhooks/events/:id
  async getWebhookEventDetails(id: string) {
    const event = await this.db
      .selectFrom('webhook_events')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!event) {
      throw new NotFoundException('Webhook event not found');
    }

    return event;
  }

  async processGatewayWebhook(
    eventId: string,
    eventType: string,
    payload: any,
  ) {
    // 1. Audit Log (omitted for brevity, same as before) ...

    const paymentId = this.extractPaymentId(payload);
    if (!paymentId) return { status: 'ignored' };

    // 3. Update the Ledger & Payment State atomically
    await this.db.transaction().execute(async (trx) => {
      const payment = await trx
        .selectFrom('payments')
        .select(['id', 'status', 'amount'])
        .where('id', '=', paymentId)
        .forUpdate()
        .executeTakeFirst();

      if (!payment || payment.status === 'CAPTURED') return;

      const isSuccessEvent =
        eventType === 'virtual_account.paid' ||
        eventType === 'qr.payment' ||
        (eventType.includes('ewallet') && payload.data?.status === 'SUCCEEDED');

      if (isSuccessEvent) {
        // A. Update payment status
        await trx
          .updateTable('payments')
          .set({ status: 'CAPTURED', updated_at: new Date().toISOString() })
          .where('id', '=', payment.id)
          .execute();

        // B. ---> TRIGGER THE IMMUTABLE FEE SNAPSHOT <---
        await this.feesService.calculateAndSnapshotFees(payment.id, trx);

        // C. Write to immutable ledger
        await trx
          .insertInto('payment_ledger')
          .values({
            payment_id: payment.id,
            entry_type: 'CAPTURED',
            amount: payment.amount,
            currency: 'IDR',
            metadata: JSON.stringify({ source: 'webhook', event_id: eventId }),
          })
          .execute();

        await trx
          .updateTable('webhook_events')
          .set({ payment_id: payment.id })
          .where('event_id', '=', eventId)
          .execute();
      }
    });

    return { status: 'processed' };
  }
}
