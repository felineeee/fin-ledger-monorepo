import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('payment_channel_code')
    .asEnum([
      // Virtual Accounts
      'BCA',
      'BNI',
      'MANDIRI',
      'BRI',
      'PERMATA',
      'CIMB',

      // E-Wallets
      'GOPAY',
      'SHOPEEPAY',
      'DANA',
      'OVO',
      'LINKAJA',

      // QRIS Providers
      'NOBU',
      'QRIS',

      // Credit / Debit / Fallback
      'CARD',
      'GENERIC',
    ])
    .execute();

  await db.schema
    .alterTable('payment_methods')
    .addColumn('channel_code', sql`payment_channel_code`, (col) =>
      col.defaultTo('GENERIC').notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_payment_methods_type_channel')
    .on('payment_methods')
    .columns(['provider', 'type', 'channel_code'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_payment_methods_type_channel').execute();

  await db.schema
    .alterTable('payment_methods')
    .dropColumn('channel_code')
    .execute();

  await db.schema.dropType('payment_channel_code').execute();
}
