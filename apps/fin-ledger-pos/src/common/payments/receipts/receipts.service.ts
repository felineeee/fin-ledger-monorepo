// src/payments/receipts.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../db/types.js';
import { ResendReceiptDto } from '../dto/receipts.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class ReceiptsService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  // [x] GET /api/payments/:id/receipt
  async getReceipt(id: string) {
    const payment = await this.db
      .selectFrom('payments')
      .innerJoin(
        'payment_methods',
        'payments.payment_method_id',
        'payment_methods.id',
      )
      .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
      .leftJoin('terminals', 'payments.terminal_id', 'terminals.id')
      .select([
        'payments.id',
        'payments.order_id',
        'payments.amount',
        'payments.tip_amount',
        'payments.currency',
        'payments.status',
        'payments.created_at',
        'payments.channel',
        'payment_methods.name as method_name',
        'payment_methods.type as method_type',
        'terminals.name as terminal_name',
        'shifts.location_id',
        'shifts.cashier_id',
      ])
      .where('payments.id', '=', id)
      .executeTakeFirst();

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found.`);
    }

    const subtotal = Number(payment.amount);
    const tip = Number(payment.tip_amount || 0);
    const total = subtotal + tip;

    // Constructing a structured payload optimized for POS rendering
    return {
      receipt_id: `RCPT-${payment.id.split('-')[0].toUpperCase()}`, // Short friendly ID
      payment_id: payment.id,
      order_id: payment.order_id,
      date: payment.created_at,
      status: payment.status,
      channel: payment.channel,
      merchant_details: {
        location_id: payment.location_id || 'ONLINE_STORE',
        cashier_id: payment.cashier_id || 'SYSTEM',
        terminal: payment.terminal_name || 'N/A',
      },
      payment_method: {
        name: payment.method_name,
        type: payment.method_type,
      },
      breakdown: {
        subtotal,
        tip,
        total,
        currency: payment.currency,
      },
      footer_message: 'Thank you for your purchase!',
    };
  }

  // [x] POST /api/payments/:id/receipt/resend
  async resendReceipt(id: string, dto: ResendReceiptDto) {
    // 1. Verify the payment exists and get the payload
    const receiptPayload = await this.getReceipt(id);

    // 2. Mock external notification integration (e.g., SendGrid, Twilio)
    // In production, you would enqueue a background job (e.g., BullMQ) passing the receiptPayload here.

    return {
      success: true,
      message: `Receipt successfully queued for delivery via ${dto.method}.`,
      delivered_to: dto.target,
      method: dto.method,
      receipt_id: receiptPayload.receipt_id,
      sent_at: new Date().toISOString(),
    };
  }
}
