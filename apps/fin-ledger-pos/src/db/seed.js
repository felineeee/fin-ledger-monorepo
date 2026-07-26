import path from 'node:path';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
// Ensure .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { Pool } = pg;
async function runSeed() {
    console.log('Starting Payments & Finance Database Seed Batch...\n');
    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL is not set in environment.');
        process.exit(1);
    }
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    // Using <any> since we are just pushing raw data based on the schema definitions
    const db = new Kysely({
        dialect: new PostgresDialect({ pool }),
    });
    try {
        const batchSuffix = Date.now().toString().slice(-4);
        const nowIso = new Date().toISOString();
        // Generate fixed UUIDs for relationships across the transaction
        const ids = {
            location: randomUUID(),
            cashier: randomUUID(),
            order1: randomUUID(),
            order2: randomUUID(),
            methodCash: randomUUID(),
            methodCard: randomUUID(),
            methodOnline: randomUUID(),
            terminal: randomUUID(),
            shift: randomUUID(),
            paymentCash: randomUUID(),
            paymentOnline: randomUUID(),
        };
        let totalRowsInserted = 0;
        await db.transaction().execute(async (trx) => {
            // --------------------------------------------------------
            // 1. PAYMENT METHODS & FEES (Phase 1 & 5)
            // --------------------------------------------------------
            const methodsRes = await trx
                .insertInto('payment_methods')
                .values([
                {
                    id: ids.methodCash,
                    name: 'Main Register Cash',
                    type: 'CASH',
                    is_active: true,
                    config: JSON.stringify({ require_drawer_open: true }),
                },
                {
                    id: ids.methodCard,
                    name: 'Stripe Terminal (Card)',
                    type: 'CARD',
                    is_active: true,
                    config: JSON.stringify({ provider: 'stripe' }),
                },
                {
                    id: ids.methodOnline,
                    name: 'Xendit Gateway (VA & QRIS)',
                    type: 'VIRTUAL_ACCOUNT',
                    is_active: true,
                    config: JSON.stringify({
                        api_key: 'xnd_dev_mock_key',
                        enabled_channels: ['VIRTUAL_ACCOUNT', 'QRIS'],
                    }),
                },
            ])
                .execute();
            const feesRes = await trx
                .insertInto('fee_schedules')
                .values([
                { payment_method_id: ids.methodCash, flat_fee: 0, percentage_fee: 0 },
                {
                    payment_method_id: ids.methodCard,
                    flat_fee: 0,
                    percentage_fee: 0.029,
                }, // 2.9%
                {
                    payment_method_id: ids.methodOnline,
                    flat_fee: 4000,
                    percentage_fee: 0,
                }, // Flat Rp 4000
            ])
                .execute();
            const phase1Count = Number(methodsRes[0]?.numInsertedOrUpdatedRows ?? 3) +
                Number(feesRes[0]?.numInsertedOrUpdatedRows ?? 3);
            totalRowsInserted += phase1Count;
            console.log(`[1/5] Configuration: Seeded Payment Methods & Fee Schedules (${phase1Count} records)`);
            // --------------------------------------------------------
            // 2. TERMINALS & SHIFTS (Phase 2)
            // --------------------------------------------------------
            const terminalRes = await trx
                .insertInto('terminals')
                .values({
                id: ids.terminal,
                location_id: ids.location,
                name: `Front Desk POS - ${batchSuffix}`,
                serial_number: `STRIPE-TM-${batchSuffix}`,
                status: 'ACTIVE',
            })
                .execute();
            const shiftRes = await trx
                .insertInto('shifts')
                .values({
                id: ids.shift,
                location_id: ids.location,
                cashier_id: ids.cashier,
                status: 'CLOSED',
                starting_float: 500000, // IDR 500k float
                expected_cash: 650000, // Expected end-of-day
                actual_cash: 650000, // Perfect balance
                variance: 0,
                closed_at: nowIso,
            })
                .execute();
            const dropRes = await trx
                .insertInto('cash_drops')
                .values({
                id: randomUUID(),
                shift_id: ids.shift,
                amount: 1000000,
                recorded_by: ids.cashier,
            })
                .execute();
            const phase2Count = Number(terminalRes[0]?.numInsertedOrUpdatedRows ?? 1) +
                Number(shiftRes[0]?.numInsertedOrUpdatedRows ?? 1) +
                Number(dropRes[0]?.numInsertedOrUpdatedRows ?? 1);
            totalRowsInserted += phase2Count;
            console.log(`[2/5] Hardware & Operations: Configured Terminal and POS Shift (${phase2Count} records)`);
            // --------------------------------------------------------
            // 3. PAYMENTS & LEDGER (Phase 2, 3, 4)
            // --------------------------------------------------------
            const paymentsRes = await trx
                .insertInto('payments')
                .values([
                {
                    id: ids.paymentCash,
                    order_id: ids.order1,
                    shift_id: ids.shift,
                    terminal_id: null,
                    payment_method_id: ids.methodCash,
                    channel: 'IN_PERSON',
                    status: 'CAPTURED',
                    amount: 150000,
                    tip_amount: 10000,
                    currency: 'IDR',
                },
                {
                    id: ids.paymentOnline,
                    order_id: ids.order2,
                    shift_id: null, // Online payments don't have shifts
                    terminal_id: null,
                    payment_method_id: ids.methodOnline,
                    channel: 'ONLINE',
                    status: 'PENDING', // Waiting for webhook
                    amount: 750000,
                    tip_amount: 0,
                    currency: 'IDR',
                },
            ])
                .execute();
            const ledgerRes = await trx
                .insertInto('payment_ledger')
                .values([
                {
                    payment_id: ids.paymentCash,
                    entry_type: 'PAYMENT_CREATED',
                    amount: 150000,
                    currency: 'IDR',
                },
                {
                    payment_id: ids.paymentCash,
                    entry_type: 'CAPTURED',
                    amount: 150000,
                    currency: 'IDR',
                },
                {
                    payment_id: ids.paymentCash,
                    entry_type: 'TIP_ADDED',
                    amount: 10000,
                    currency: 'IDR',
                },
                {
                    payment_id: ids.paymentOnline,
                    entry_type: 'PAYMENT_CREATED',
                    amount: 750000,
                    currency: 'IDR',
                },
            ])
                .execute();
            const phase3Count = Number(paymentsRes[0]?.numInsertedOrUpdatedRows ?? 2) +
                Number(ledgerRes[0]?.numInsertedOrUpdatedRows ?? 4);
            totalRowsInserted += phase3Count;
            console.log(`[3/5] Transactions: Processed Cash Capture & Pending Online Checkout (${phase3Count} records)`);
            // --------------------------------------------------------
            // 4. REFUNDS & DISPUTES (Phase 3 & 4)
            // --------------------------------------------------------
            const refundRes = await trx
                .insertInto('refunds')
                .values({
                id: randomUUID(),
                payment_id: ids.paymentCash,
                amount: 50000, // Partial refund
                reason: 'Customer returned one item',
                status: 'COMPLETED',
            })
                .execute();
            const refundLedgerRes = await trx
                .insertInto('payment_ledger')
                .values({
                payment_id: ids.paymentCash,
                entry_type: 'REFUNDED',
                amount: -50000, // Negative for refunds
                currency: 'IDR',
            })
                .execute();
            // Update the payment status to PARTIALLY_REFUNDED
            await trx
                .updateTable('payments')
                .set({ status: 'PARTIALLY_REFUNDED' })
                .where('id', '=', ids.paymentCash)
                .execute();
            const phase4Count = Number(refundRes[0]?.numInsertedOrUpdatedRows ?? 1) +
                Number(refundLedgerRes[0]?.numInsertedOrUpdatedRows ?? 1);
            totalRowsInserted += phase4Count;
            console.log(`[4/5] Post-Processing: Logged Partial Refund (${phase4Count} records)`);
            // --------------------------------------------------------
            // 5. SETTLEMENTS & FINANCES (Phase 5)
            // --------------------------------------------------------
            const settlementRes = await trx
                .insertInto('settlements')
                .values({
                id: randomUUID(),
                provider: 'XENDIT',
                amount: 5000000,
                status: 'PENDING',
            })
                .execute();
            totalRowsInserted += Number(settlementRes[0]?.numInsertedOrUpdatedRows ?? 1);
            console.log(`[5/5] Back-Office: Created pending bank settlement (1 record)`);
            console.log('\n----------------------------------------');
            console.log(`Payment Seed Summary (Tag: #${batchSuffix}):`);
            console.log(` - Total Records Inserted: ${totalRowsInserted} rows`);
            console.log(` - Test Location ID      : ${ids.location}`);
            console.log(` - Cashier Shift ID      : ${ids.shift}`);
            console.log('----------------------------------------');
        });
        console.log('Database Seeding Completed Successfully!');
    }
    catch (error) {
        console.error('Seeding Failed:', error);
        process.exitCode = 1;
    }
    finally {
        await db.destroy();
    }
}
runSeed();
