import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import { KYSELY_DB } from '@fin-ledger/databases';
import { FeesService } from '../../finance/fees/fees.service';
import { GatewayConfigService } from '../../gateway/gateway-config/gateway-config.service';
import { PaymentCallback } from 'xendit-node/payment_request/models';
import { validate as isUuid } from 'uuid';
@Injectable()
export class WebhooksService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<DB>,
    private readonly feesService: FeesService,
    private readonly configService: GatewayConfigService,
  ) {}

  /**
   * Extract internal payment UUID from strongly-typed PaymentCallback or legacy fallback
   */
  private extractPaymentId(payload: PaymentCallback): string | null {
    const raw = payload as any;

    // Candidate extraction across Xendit formats
    const candidates = [
      payload.data?.referenceId, // Payment Request API (v2)
      raw.data?.reference_id, // Unified Callbacks
      raw.reference_id, // Legacy Callback
      raw.external_id, // Invoices / Fixed VAs
      raw.data?.qr_code?.external_id, // QRIS
    ];

    for (const candidate of candidates) {
      // ONLY return if candidate exists and is a valid UUID!
      if (candidate && typeof candidate === 'string' && isUuid(candidate)) {
        return candidate;
      }
    }

    return null; // Return null if no valid UUID is found (will log safely without crashing SQL)
  }

  /**
   * Helper to check if event denotes payment success
   */
  private isSuccessEvent(eventType: string, payload: PaymentCallback): boolean {
    const status = payload.data?.status || (payload as any).status;

    return (
      status === 'SUCCEEDED' ||
      status === 'PAID' ||
      eventType === 'payment_request.succeeded' ||
      eventType === 'virtual_account.paid' ||
      eventType === 'qr.payment' ||
      eventType === 'invoice.paid'
    );
  }

  /**
   * Helper to check if event denotes failure or expiration
   */
  private isFailedEvent(eventType: string, payload: PaymentCallback): boolean {
    const status = payload.data?.status || (payload as any).status;

    return (
      status === 'FAILED' ||
      status === 'EXPIRED' ||
      eventType === 'payment_request.failed' ||
      eventType === 'invoice.expired'
    );
  }

  // [x] POST /api/webhooks/gateway
  async handleGatewayWebhook(
    callbackToken: string,
    eventType: string,
    payload: PaymentCallback,
  ) {
    // 1. Verify Xendit Token
    const expectedToken = this.configService.getWebhookToken();
    if (expectedToken && callbackToken !== expectedToken) {
      throw new UnauthorizedException('Invalid callback token');
    }

    const rawPayload = payload as any;
    const eventId = rawPayload.id || rawPayload.event_id || `ev_${Date.now()}`;
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

      // 3. Log Raw Webhook Event
      await trx
        .insertInto('webhook_events')
        .values({
          event_id: eventId,
          payment_id: paymentId || null,
          event_type: eventType || payload.event || 'UNKNOWN',
          payload: JSON.stringify(payload),
        })
        .execute();

      if (!paymentId) {
        return {
          success: true,
          message: 'Webhook logged without payment ID mapping',
        };
      }

      // 4. Lock & Select Payment Row to prevent race conditions
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
        // A. Update Payment Status to CAPTURED
        await trx
          .updateTable('payments')
          .set({ status: 'CAPTURED', updated_at: sql`NOW()` })
          .where('id', '=', payment.id)
          .execute();

        // B. Calculate and Snapshot Fees
        await this.feesService.calculateAndSnapshotFees(payment.id, trx);

        // C. Record entry in Immutable Payment Ledger
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
                payload.data?.paymentMethod?.type || rawPayload.payment_method,
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
}
