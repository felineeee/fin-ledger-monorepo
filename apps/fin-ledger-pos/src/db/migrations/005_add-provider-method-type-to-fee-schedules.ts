import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE fee_schedules DROP CONSTRAINT IF EXISTS uq_fee_schedule_method_channel`.execute(
    db,
  );

  await sql`
    ALTER TABLE fee_schedules
      ADD COLUMN IF NOT EXISTS channel_code varchar(50),
      ADD COLUMN IF NOT EXISTS vat_rate decimal(5,4) DEFAULT 0.1100,
      ADD COLUMN IF NOT EXISTS min_fee decimal(19,4),
      ADD COLUMN IF NOT EXISTS max_fee decimal(19,4),
      ADD COLUMN IF NOT EXISTS provider varchar(50),
      ADD COLUMN IF NOT EXISTS method_type payment_method_type,
      ALTER COLUMN payment_method_id DROP NOT NULL
  `.execute(db);

  await sql`ALTER TABLE fee_schedules DROP CONSTRAINT IF EXISTS uq_fee_schedule_provider_method_channel`.execute(
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
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE fee_schedules DROP CONSTRAINT IF EXISTS uq_fee_schedule_provider_method_channel`.execute(
    db,
  );

  await db.schema
    .alterTable('fee_schedules')
    .dropColumn('method_type')
    .dropColumn('provider')
    .alterColumn('payment_method_id', (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable('fee_schedules')
    .addUniqueConstraint('uq_fee_schedule_method_channel', [
      'payment_method_id',
      'channel_code',
    ])
    .execute();
}
