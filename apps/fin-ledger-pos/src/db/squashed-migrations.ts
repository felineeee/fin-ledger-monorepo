import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('payment_status')
    .asEnum([
      'PENDING',
      'AUTHORIZED',
      'CAPTURED',
      'PARTIALLY_REFUNDED',
      'REFUNDED',
      'VOIDED',
      'FAILED',
      'DISPUTED',
    ])
    .execute();
  await db.schema
    .createType('payment_channel')
    .asEnum(['IN_PERSON', 'ONLINE'])
    .execute();
  await db.schema
    .createType('shift_status')
    .asEnum(['OPEN', 'CLOSED', 'FORCE_CLOSED'])
    .execute();
  await db.schema
    .createType('ledger_entry_type')
    .asEnum([
      'PAYMENT_CREATED',
      'AUTHORIZED',
      'CAPTURED',
      'TIP_ADDED',
      'VOIDED',
      'REFUNDED',
      'FEE_DEDUCTED',
      'DISPUTED',
    ])
    .execute();
  await db.schema
    .createType('refund_status')
    .asEnum(['PENDING', 'COMPLETED', 'FAILED'])
    .execute();
  await db.schema
    .createType('terminal_status')
    .asEnum(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
    .execute();
  await db.schema
    .createType('payment_method_type')
    .asEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT', 'QRIS'])
    .execute();
  await db.schema
    .createType('dispute_status')
    .asEnum(['PENDING', 'WON', 'LOST'])
    .execute();
  await db.schema
    .createType('settlement_status')
    .asEnum(['PENDING', 'PAID'])
    .execute();

  await db.schema
    .createTable('payment_methods')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('type', sql`payment_method_type`, (col) => col.notNull())
    .addColumn('provider', 'varchar(50)', (col) =>
      col.defaultTo('DEFAULT').notNull(),
    )
    .addColumn('is_active', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('config', 'jsonb', (col) => col.defaultTo('{}'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('terminals')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('location_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('serial_number', 'varchar', (col) => col.unique())
    .addColumn('status', sql`terminal_status`, (col) =>
      col.defaultTo('ACTIVE').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('shifts')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('location_id', 'uuid', (col) => col.notNull())
    .addColumn('cashier_id', 'uuid', (col) => col.notNull())
    .addColumn('status', sql`shift_status`, (col) =>
      col.defaultTo('OPEN').notNull(),
    )
    .addColumn('starting_float', sql`decimal(19,4)`, (col) =>
      col.defaultTo(0).notNull(),
    )
    .addColumn('ending_cash_expected', sql`decimal(19,4)`)
    .addColumn('ending_cash_actual', sql`decimal(19,4)`)
    .addColumn('variance', sql`decimal(19,4)`)
    .addColumn('total_cash_drops', sql`decimal(19,4)`, (col) =>
      col.defaultTo(0),
    )
    .addColumn('opened_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('closed_at', 'timestamptz')
    .execute();

  await sql`CREATE UNIQUE INDEX idx_one_open_shift_per_location_cashier ON shifts (location_id, cashier_id) WHERE status = 'OPEN'`.execute(
    db,
  );

  await db.schema
    .createTable('cash_drops')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('shift_id', 'uuid', (col) =>
      col.references('shifts.id').onDelete('cascade').notNull(),
    )
    .addColumn('amount', sql`decimal(19,4)`, (col) => col.notNull())
    .addColumn('recorded_by', 'uuid', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addCheckConstraint('check_cash_drop_positive', sql`amount > 0`)
    .execute();

  await db.schema
    .createTable('fee_schedules')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payment_method_id', 'uuid', (col) =>
      col.references('payment_methods.id').onDelete('cascade').notNull(),
    )
    .addColumn('channel_code', 'varchar(50)')
    .addColumn('flat_fee', sql`decimal(19,4)`, (col) =>
      col.defaultTo(0).notNull(),
    )
    .addColumn('percentage_fee', sql`decimal(5,4)`, (col) =>
      col.defaultTo(0).notNull(),
    )
    .addColumn('vat_rate', sql`decimal(5,4)`, (col) =>
      col.notNull().defaultTo(0.11),
    )
    .addColumn('min_fee', sql`decimal(19,4)`)
    .addColumn('max_fee', sql`decimal(19,4)`)
    .addColumn('is_active', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addUniqueConstraint('uq_fee_schedule_method_channel', [
      'payment_method_id',
      'channel_code',
    ])
    .execute();

  await db.schema
    .createTable('payments')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', (col) => col.notNull())
    .addColumn('location_id', 'uuid')
    .addColumn('shift_id', 'uuid', (col) => col.references('shifts.id'))
    .addColumn('terminal_id', 'uuid', (col) => col.references('terminals.id'))
    .addColumn('payment_method_id', 'uuid', (col) =>
      col.references('payment_methods.id').notNull(),
    )
    .addColumn('fee_schedule_id', 'uuid', (col) =>
      col.references('fee_schedules.id').onDelete('set null'),
    )
    .addColumn('channel', sql`payment_channel`, (col) => col.notNull())
    .addColumn('status', sql`payment_status`, (col) =>
      col.defaultTo('PENDING').notNull(),
    )
    .addColumn('amount', sql`decimal(19,4)`, (col) => col.notNull())
    .addColumn('tip_amount', sql`decimal(19,4)`, (col) =>
      col.defaultTo(0).notNull(),
    )
    .addColumn('currency', 'varchar(3)', (col) =>
      col.defaultTo('IDR').notNull(),
    )
    .addColumn('idempotency_key', 'varchar', (col) => col.unique())
    .addColumn('snap_flat_fee', sql`decimal(19,4)`)
    .addColumn('snap_percentage_fee', sql`decimal(5,4)`)
    .addColumn('snap_vat_rate', sql`decimal(5,4)`)
    .addColumn('total_fee_deducted', sql`decimal(19,4)`)
    .addColumn('net_payout', sql`decimal(19,4)`)
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addCheckConstraint('check_amount_positive', sql`amount > 0`)
    .execute();

  await db.schema
    .createTable('refunds')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payment_id', 'uuid', (col) =>
      col.references('payments.id').onDelete('restrict').notNull(),
    )
    .addColumn('amount', sql`decimal(19,4)`, (col) => col.notNull())
    .addColumn('reason', 'varchar')
    .addColumn('status', sql`refund_status`, (col) =>
      col.defaultTo('PENDING').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addCheckConstraint('check_refund_amount_positive', sql`amount > 0`)
    .execute();

  await db.schema
    .createTable('payment_ledger')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payment_id', 'uuid', (col) =>
      col.references('payments.id').onDelete('cascade').notNull(),
    )
    .addColumn('entry_type', sql`ledger_entry_type`, (col) => col.notNull())
    .addColumn('amount', sql`decimal(19,4)`, (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) =>
      col.defaultTo('IDR').notNull(),
    )
    .addColumn('metadata', 'jsonb', (col) => col.defaultTo('{}'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('webhook_events')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('event_id', 'varchar', (col) => col.unique().notNull())
    .addColumn('payment_id', 'uuid', (col) =>
      col.references('payments.id').onDelete('set null'),
    )
    .addColumn('event_type', 'varchar', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('disputes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('payment_id', 'uuid', (col) =>
      col.references('payments.id').onDelete('restrict').notNull(),
    )
    .addColumn('amount', sql`decimal(19,4)`, (col) => col.notNull())
    .addColumn('status', sql`dispute_status`, (col) =>
      col.defaultTo('PENDING').notNull(),
    )
    .addColumn('evidence_text', 'text')
    .addColumn('evidence_url', 'varchar')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('settlements')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('provider', 'varchar', (col) => col.notNull())
    .addColumn('amount', sql`decimal(19,4)`, (col) => col.notNull())
    .addColumn('status', sql`settlement_status`, (col) =>
      col.defaultTo('PENDING').notNull(),
    )
    .addColumn('settled_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('daily_reconciliations')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('location_id', 'uuid', (col) => col.notNull())
    .addColumn('reconciliation_date', 'date', (col) => col.notNull())
    .addColumn('total_shifts', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('total_opening_float', sql`decimal(19,4)`, (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('total_ending_cash_actual', sql`decimal(19,4)`, (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('total_cash_drops', sql`decimal(19,4)`, (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('total_variance', sql`decimal(19,4)`, (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('notes', 'text')
    .addColumn('closed_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addUniqueConstraint('uq_location_reconciliation_date', [
      'location_id',
      'reconciliation_date',
    ])
    .execute();

  await db.schema
    .createIndex('idx_payments_order_id')
    .on('payments')
    .column('order_id')
    .execute();
  await db.schema
    .createIndex('idx_ledger_payment_id')
    .on('payment_ledger')
    .column('payment_id')
    .execute();
  await db.schema
    .createIndex('idx_refunds_payment_id')
    .on('refunds')
    .column('payment_id')
    .execute();
  await db.schema
    .createIndex('idx_webhook_events_payment_id')
    .on('webhook_events')
    .column('payment_id')
    .execute();
  await db.schema
    .createIndex('idx_disputes_payment_id')
    .on('disputes')
    .column('payment_id')
    .execute();
  await db.schema
    .createIndex('idx_fee_schedules_method_id')
    .on('fee_schedules')
    .column('payment_method_id')
    .execute();
  await db.schema
    .createIndex('idx_payments_fee_schedule_id')
    .on('payments')
    .column('fee_schedule_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('daily_reconciliations').execute();
  await db.schema.dropTable('settlements').execute();
  await db.schema.dropTable('disputes').execute();
  await db.schema.dropTable('webhook_events').execute();
  await db.schema.dropTable('payment_ledger').execute();
  await db.schema.dropTable('refunds').execute();
  await db.schema.dropTable('payments').execute();
  await db.schema.dropTable('fee_schedules').execute();
  await db.schema.dropTable('cash_drops').execute();
  await db.schema.dropTable('shifts').execute();
  await db.schema.dropTable('terminals').execute();
  await db.schema.dropTable('payment_methods').execute();

  await db.schema.dropType('settlement_status').execute();
  await db.schema.dropType('dispute_status').execute();
  await db.schema.dropType('terminal_status').execute();
  await db.schema.dropType('refund_status').execute();
  await db.schema.dropType('ledger_entry_type').execute();
  await db.schema.dropType('shift_status').execute();
  await db.schema.dropType('payment_channel').execute();
  await db.schema.dropType('payment_status').execute();
  await db.schema.dropType('payment_method_type').execute();
}
