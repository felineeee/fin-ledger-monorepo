import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
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
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('payments')
    .dropColumn('net_payout')
    .dropColumn('total_fee_deducted')
    .dropColumn('snap_vat_rate')
    .dropColumn('snap_percentage_fee')
    .dropColumn('snap_flat_fee')
    .dropColumn('fee_schedule_id')
    .execute();
}
