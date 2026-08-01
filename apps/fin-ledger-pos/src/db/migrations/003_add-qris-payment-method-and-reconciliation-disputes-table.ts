import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Update ENUMs with new values
  await sql`ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'QRIS'`.execute(
    db,
  );
  await sql`ALTER TYPE ledger_entry_type ADD VALUE IF NOT EXISTS 'DISPUTED'`.execute(
    db,
  );

  // 2. Alter existing `shifts` table
  await db.schema
    .alterTable('shifts')
    .addColumn('ending_cash_expected', sql`decimal(19,4)`)
    .addColumn('ending_cash_actual', sql`decimal(19,4)`)
    .addColumn('total_cash_drops', sql`decimal(19,4)`, (col) =>
      col.defaultTo(0),
    )
    .execute();

  // 3. Create missing `daily_reconciliations` table
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
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('daily_reconciliations').execute();

  await db.schema
    .alterTable('shifts')
    .dropColumn('ending_cash_expected')
    .dropColumn('ending_cash_actual')
    .dropColumn('total_cash_drops')
    .execute();
}
