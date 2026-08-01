import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // ---------------------------------------------------------
  // 1. SHIFTS: Clean up duplicate cash columns
  // (Migration 1 created expected_cash/actual_cash, but
  // Migration 3 created ending_cash_expected/ending_cash_actual)
  // ---------------------------------------------------------
  await db.schema
    .alterTable('shifts')
    .dropColumn('expected_cash')
    .dropColumn('actual_cash')
    .execute();

  // ---------------------------------------------------------
  // 2. PAYMENTS: Add location_id for easier reporting
  // (Required for the Phase 5 Financial Reports to aggregate company revenue)
  // ---------------------------------------------------------
  // Note: Assuming a 'locations' table exists. If it doesn't, skip the .references()
  await db.schema
    .alterTable('payments')
    .addColumn('location_id', 'uuid')
    .execute();

  // ---------------------------------------------------------
  // 3. PAYMENT METHODS: Add 'provider'
  // (So you can group reports by XENDIT vs STRIPE vs INTERNAL)
  // ---------------------------------------------------------
  await db.schema
    .alterTable('payment_methods')
    .addColumn('provider', 'varchar(50)', (col) =>
      col.defaultTo('DEFAULT').notNull(),
    )
    .execute();

  // ---------------------------------------------------------
  // 4. FEE SCHEDULES: Enforce Strict Relational Architecture
  // (Reverting the string-matching from Migration 5 and locking it down)
  // ---------------------------------------------------------

  // A. Drop the loose string constraints from Migration 5
  await sql`ALTER TABLE fee_schedules DROP CONSTRAINT IF EXISTS uq_fee_schedule_provider_method_channel`.execute(
    db,
  );

  // B. Remove the string columns and add the missing 'is_active' flag
  await db.schema
    .alterTable('fee_schedules')
    .dropColumn('provider')
    .dropColumn('method_type')
    .addColumn('is_active', 'boolean', (col) => col.defaultTo(true).notNull())
    .execute();

  // C. Lock payment_method_id back to NOT NULL
  await sql`ALTER TABLE fee_schedules ALTER COLUMN payment_method_id SET NOT NULL`.execute(
    db,
  );

  // D. Re-add the strict relational unique constraint
  await db.schema
    .alterTable('fee_schedules')
    .addUniqueConstraint('uq_fee_schedule_method_channel', [
      'payment_method_id',
      'channel_code',
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // 1. Revert Fee Schedules
  await sql`ALTER TABLE fee_schedules DROP CONSTRAINT IF EXISTS uq_fee_schedule_method_channel`.execute(
    db,
  );

  await db.schema
    .alterTable('fee_schedules')
    .dropColumn('is_active')
    .addColumn('provider', 'varchar(50)')
    .addColumn('method_type', sql`payment_method_type`)
    .execute();

  await sql`ALTER TABLE fee_schedules ALTER COLUMN payment_method_id DROP NOT NULL`.execute(
    db,
  );

  await db.schema
    .alterTable('fee_schedules')
    .addUniqueConstraint('uq_fee_schedule_provider_method_channel', [
      'provider',
      'method_type',
      'channel_code',
    ])
    .execute();

  // 2. Revert Payment Methods
  await db.schema
    .alterTable('payment_methods')
    .dropColumn('provider')
    .execute();

  // 3. Revert Payments
  await db.schema.alterTable('payments').dropColumn('location_id').execute();

  // 4. Revert Shifts
  await db.schema
    .alterTable('shifts')
    .addColumn('expected_cash', sql`decimal(19,4)`)
    .addColumn('actual_cash', sql`decimal(19,4)`)
    .execute();
}
