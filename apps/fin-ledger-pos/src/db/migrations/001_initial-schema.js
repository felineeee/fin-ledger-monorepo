import { sql } from 'kysely';
export async function up(db) {
    // --- ENUMS ---
    await db.schema.createType('payment_status').asEnum(['PENDING', 'AUTHORIZED', 'CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOIDED', 'FAILED']).execute();
    await db.schema.createType('payment_channel').asEnum(['IN_PERSON', 'ONLINE']).execute();
    await db.schema.createType('shift_status').asEnum(['OPEN', 'CLOSED', 'FORCE_CLOSED']).execute();
    await db.schema.createType('ledger_entry_type').asEnum(['PAYMENT_CREATED', 'AUTHORIZED', 'CAPTURED', 'TIP_ADDED', 'VOIDED', 'REFUNDED', 'FEE_DEDUCTED']).execute();
    await db.schema.createType('refund_status').asEnum(['PENDING', 'COMPLETED', 'FAILED']).execute();
    await db.schema.createType('terminal_status').asEnum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).execute();
    await db.schema.createType('payment_method_type').asEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT']).execute();
    // --- 1. PAYMENT METHODS ---
    await db.schema
        .createTable('payment_methods')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('type', sql `payment_method_type`, (col) => col.notNull())
        .addColumn('is_active', 'boolean', (col) => col.defaultTo(true).notNull())
        .addColumn('config', 'jsonb', (col) => col.defaultTo('{}'))
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    // --- 2. TERMINALS ---
    await db.schema
        .createTable('terminals')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('location_id', 'uuid', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('serial_number', 'varchar', (col) => col.unique())
        .addColumn('status', sql `terminal_status`, (col) => col.defaultTo('ACTIVE').notNull())
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    // --- 3. SHIFTS (Cash Drawer Management) ---
    await db.schema
        .createTable('shifts')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('location_id', 'uuid', (col) => col.notNull())
        .addColumn('cashier_id', 'uuid', (col) => col.notNull())
        .addColumn('status', sql `shift_status`, (col) => col.defaultTo('OPEN').notNull())
        .addColumn('starting_float', sql `decimal(19,4)`, (col) => col.defaultTo(0).notNull())
        .addColumn('expected_cash', sql `decimal(19,4)`)
        .addColumn('actual_cash', sql `decimal(19,4)`)
        .addColumn('variance', sql `decimal(19,4)`)
        .addColumn('opened_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addColumn('closed_at', 'timestamptz')
        .execute();
    await sql `CREATE UNIQUE INDEX idx_one_open_shift_per_location_cashier ON shifts (location_id, cashier_id) WHERE status = 'OPEN'`.execute(db);
    // --- 3.5 CASH DROPS ---
    await db.schema
        .createTable('cash_drops')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('shift_id', 'uuid', (col) => col.references('shifts.id').onDelete('cascade').notNull())
        .addColumn('amount', sql `decimal(19,4)`, (col) => col.notNull())
        .addColumn('recorded_by', 'uuid', (col) => col.notNull())
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addCheckConstraint('check_cash_drop_positive', sql `amount > 0`)
        .execute();
    // --- 4. PAYMENTS (Core State Machine) ---
    await db.schema
        .createTable('payments')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('order_id', 'uuid', (col) => col.notNull())
        .addColumn('shift_id', 'uuid', (col) => col.references('shifts.id'))
        .addColumn('terminal_id', 'uuid', (col) => col.references('terminals.id'))
        .addColumn('payment_method_id', 'uuid', (col) => col.references('payment_methods.id').notNull())
        .addColumn('channel', sql `payment_channel`, (col) => col.notNull())
        .addColumn('status', sql `payment_status`, (col) => col.defaultTo('PENDING').notNull())
        .addColumn('amount', sql `decimal(19,4)`, (col) => col.notNull())
        .addColumn('tip_amount', sql `decimal(19,4)`, (col) => col.defaultTo(0).notNull())
        .addColumn('currency', 'varchar(3)', (col) => col.defaultTo('IDR').notNull())
        .addColumn('idempotency_key', 'varchar', (col) => col.unique())
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addCheckConstraint('check_amount_positive', sql `amount > 0`)
        .execute();
    // --- 5. REFUNDS (Lifecycle Engine) ---
    await db.schema
        .createTable('refunds')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('restrict').notNull())
        .addColumn('amount', sql `decimal(19,4)`, (col) => col.notNull())
        .addColumn('reason', 'varchar')
        .addColumn('status', sql `refund_status`, (col) => col.defaultTo('PENDING').notNull())
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addCheckConstraint('check_refund_amount_positive', sql `amount > 0`)
        .execute();
    // --- 6. PAYMENT LEDGER (Immutable Event Log) ---
    await db.schema
        .createTable('payment_ledger')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('cascade').notNull())
        .addColumn('entry_type', sql `ledger_entry_type`, (col) => col.notNull())
        .addColumn('amount', sql `decimal(19,4)`, (col) => col.notNull())
        .addColumn('currency', 'varchar(3)', (col) => col.defaultTo('IDR').notNull())
        .addColumn('metadata', 'jsonb', (col) => col.defaultTo('{}'))
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    // --- INDEXES ---
    await db.schema.createIndex('idx_payments_order_id').on('payments').column('order_id').execute();
    await db.schema.createIndex('idx_ledger_payment_id').on('payment_ledger').column('payment_id').execute();
    await db.schema.createIndex('idx_refunds_payment_id').on('refunds').column('payment_id').execute();
}
export async function down(db) {
    await db.schema.dropTable('payment_ledger').execute();
    await db.schema.dropTable('refunds').execute();
    await db.schema.dropTable('payments').execute();
    await db.schema.dropTable('cash_drops').execute();
    await db.schema.dropTable('shifts').execute();
    await db.schema.dropTable('terminals').execute();
    await db.schema.dropTable('payment_methods').execute();
    await db.schema.dropType('ledger_entry_type').execute();
    await db.schema.dropType('refund_status').execute();
    await db.schema.dropType('shift_status').execute();
    await db.schema.dropType('payment_channel').execute();
    await db.schema.dropType('payment_status').execute();
    await db.schema.dropType('terminal_status').execute();
    await db.schema.dropType('payment_method_type').execute();
}
