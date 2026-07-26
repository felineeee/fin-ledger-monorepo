// src/payments/split.service.ts
import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../db/types.js';
import { SplitPaymentDto, OrderBalanceQueryDto } from '../dto/split.dto.js';

@Injectable()
export class SplitTenderService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] POST /api/orders/:orderId/payments/split
  async processSplitTender(
    orderId: string,
    dto: SplitPaymentDto,
    idempotencyKey?: string,
  ) {
    // 1. Validation constraints
    for (const item of dto.payments) {
      if (item.channel === 'IN_PERSON' && !item.shift_id) {
        throw new ConflictException(
          'shift_id is required for all IN_PERSON payment parts.',
        );
      }
    }

    // 2. Idempotency Check
    if (idempotencyKey) {
      const existing = await this.db
        .selectFrom('payments')
        .selectAll()
        .where('idempotency_key', '=', idempotencyKey)
        .execute();

      if (existing.length > 0) return existing;
    }

    // 3. Atomic Transaction
    return this.db.transaction().execute(async (trx) => {
      const processedPayments: any[] = [];

      for (const [index, item] of dto.payments.entries()) {
        // Append an index to the idempotency key so each row has a unique identifier
        const rowIdempotency = idempotencyKey
          ? `${idempotencyKey}-part-${index}`
          : null;

        // Insert Payment (Assume split tenders submitted together are already CAPTURED/Finalized at the POS)
        const payment = await trx
          .insertInto('payments')
          .values({
            order_id: orderId,
            payment_method_id: item.payment_method_id,
            shift_id: item.shift_id ?? null,
            terminal_id: item.terminal_id ?? null,
            channel: item.channel,
            amount: item.amount,
            status: 'CAPTURED', // Skip PENDING since split tenders are usually executed atomically post-auth
            idempotency_key: rowIdempotency,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Write Immutable Ledger Event
        await trx
          .insertInto('payment_ledger')
          .values({
            payment_id: payment.id,
            entry_type: 'CAPTURED',
            amount: item.amount,
            currency: payment.currency,
            metadata: JSON.stringify(
              item.auth_code ? { auth_code: item.auth_code } : {},
            ),
          })
          .execute();

        processedPayments.push(payment);
      }

      return processedPayments;
    });
  }

  // [x] GET /api/orders/:orderId/payments/balance
  async getOrderBalance(orderId: string, query: OrderBalanceQueryDto) {
    const orderTotal = query.order_total;

    // Sum all successful captures for this order
    const result = await this.db
      .selectFrom('payments')
      .select(({ fn }) => fn.sum('amount').as('total_paid'))
      .where('order_id', '=', orderId)
      .where('status', 'in', ['CAPTURED', 'AUTHORIZED']) // Include authorized funds that hold balance
      .executeTakeFirst();

    const totalPaid = Number(result?.total_paid || 0);
    const balanceRemaining = orderTotal - totalPaid;

    return {
      order_id: orderId,
      order_total: orderTotal,
      total_paid: totalPaid,
      balance_remaining: balanceRemaining > 0 ? balanceRemaining : 0,
      is_fully_paid: balanceRemaining <= 0,
      overpaid_amount: balanceRemaining < 0 ? Math.abs(balanceRemaining) : 0,
    };
  }
}
