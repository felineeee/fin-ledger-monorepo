import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Upgrade the Fee Schedules table
  await db.schema
    .alterTable('fee_schedules')
    .addColumn('channel_code', 'varchar(50)')
    .addColumn('vat_rate', sql`decimal(5,4)`, (col) =>
      col.notNull().defaultTo(0.11),
    ) // 11% PPN Default
    .addColumn('min_fee', sql`decimal(19,4)`)
    .addColumn('max_fee', sql`decimal(19,4)`)
    .execute();

  await db.schema
    .alterTable('fee_schedules')
    .addUniqueConstraint('uq_fee_schedule_method_channel', [
      'payment_method_id',
      'channel_code',
    ])
    .execute();

  // 2. Add Immutable Snapshot columns to Payments table
  await db.schema
    .alterTable('payments')
    .addColumn('fee_schedule_id', 'uuid', (col) =>
      col.references('fee_schedules.id').onDelete('set null'),
    )

    .addColumn('snap_flat_fee', sql`decimal(19,4)`)
    .addColumn('snap_percentage_fee', sql`decimal(5,4)`)
    .addColumn('snap_vat_rate', sql`decimal(5,4)`)

    .addColumn('total_fee_deducted', sql`decimal(19,4)`)
    .addColumn('net_payout', sql`decimal(19,4)`)
    .execute();

  await db.schema
    .createIndex('idx_payments_fee_schedule_id')
    .on('payments')
    .column('fee_schedule_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_payments_fee_schedule_id').execute();

  await db.schema
    .alterTable('payments')
    .dropColumn('net_payout')
    .dropColumn('total_fee_deducted')
    .dropColumn('snap_vat_rate')
    .dropColumn('snap_percentage_fee')
    .dropColumn('snap_flat_fee')
    .dropColumn('fee_schedule_id')
    .execute();

  await db.schema
    .alterTable('fee_schedules')
    .dropConstraint('uq_fee_schedule_method_channel')
    .execute();

  await db.schema
    .alterTable('fee_schedules')
    .dropColumn('max_fee')
    .dropColumn('min_fee')
    .dropColumn('vat_rate')
    .dropColumn('channel_code')
    .execute();
}
