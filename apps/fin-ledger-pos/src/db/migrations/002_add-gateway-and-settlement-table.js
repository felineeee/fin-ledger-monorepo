// e.g. 002_add_gateway_and_settlement_tables.ts
import { sql } from 'kysely';
export async function up(db) {
    await db.schema.createType('dispute_status').asEnum(['PENDING', 'WON', 'LOST']).execute();
    await db.schema.createType('settlement_status').asEnum(['PENDING', 'PAID']).execute();
    await db.schema
        .createTable('webhook_events')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('event_id', 'varchar', (col) => col.unique().notNull())
        .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('set null'))
        .addColumn('event_type', 'varchar', (col) => col.notNull())
        .addColumn('payload', 'jsonb', (col) => col.notNull())
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    await db.schema
        .createTable('disputes')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('restrict').notNull())
        .addColumn('amount', sql `decimal(19,4)`, (col) => col.notNull())
        .addColumn('status', sql `dispute_status`, (col) => col.defaultTo('PENDING').notNull())
        .addColumn('evidence_text', 'text')
        .addColumn('evidence_url', 'varchar')
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    await db.schema
        .createTable('fee_schedules')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('payment_method_id', 'uuid', (col) => col.references('payment_methods.id').onDelete('cascade').notNull())
        .addColumn('flat_fee', sql `decimal(19,4)`, (col) => col.defaultTo(0).notNull())
        .addColumn('percentage_fee', sql `decimal(5,4)`, (col) => col.defaultTo(0).notNull())
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    await db.schema
        .createTable('settlements')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql `gen_random_uuid()`))
        .addColumn('provider', 'varchar', (col) => col.notNull())
        .addColumn('amount', sql `decimal(19,4)`, (col) => col.notNull())
        .addColumn('status', sql `settlement_status`, (col) => col.defaultTo('PENDING').notNull())
        .addColumn('settled_at', 'timestamptz')
        .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql `now()`).notNull())
        .execute();
    await db.schema.createIndex('idx_webhook_events_payment_id').on('webhook_events').column('payment_id').execute();
    await db.schema.createIndex('idx_disputes_payment_id').on('disputes').column('payment_id').execute();
    await db.schema.createIndex('idx_fee_schedules_method_id').on('fee_schedules').column('payment_method_id').execute();
}
export async function down(db) {
    await db.schema.dropTable('settlements').execute();
    await db.schema.dropTable('fee_schedules').execute();
    await db.schema.dropTable('disputes').execute();
    await db.schema.dropTable('webhook_events').execute();
    await db.schema.dropType('settlement_status').execute();
    await db.schema.dropType('dispute_status').execute();
}
