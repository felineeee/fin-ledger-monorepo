import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);

  // 1. LOCATIONS
  await db.schema
    .createTable('locations')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('type', 'varchar', (col) => col.notNull().defaultTo('STORE'))
    .addColumn('address', 'text')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();

  // 2. INVENTORY LEVELS
  await db.schema
    .createTable('inventory_levels')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('location_id', 'uuid', (col) =>
      col.references('locations.id').onDelete('cascade').notNull(),
    )
    .addColumn('product_id', 'uuid', (col) => col.notNull())
    .addColumn('variant_id', 'uuid')
    .addColumn('quantity_on_hand', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('quantity_reserved', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('reorder_point', 'integer')
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .addCheckConstraint(
      'check_qty_reserved_positive',
      sql`quantity_reserved >= 0`,
    )
    .execute();

  // Null-safe unique constraint for products without variants
  await sql`
    CREATE UNIQUE INDEX idx_unique_inventory_level 
    ON inventory_levels (location_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'))
  `.execute(db);

  // 3. INVENTORY LEDGER
  await db.schema
    .createTable('inventory_ledger')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('location_id', 'uuid', (col) =>
      col.references('locations.id').onDelete('cascade').notNull(),
    )
    .addColumn('product_id', 'uuid', (col) => col.notNull())
    .addColumn('variant_id', 'uuid')
    .addColumn('transaction_type', 'varchar', (col) => col.notNull())
    .addColumn('quantity_change', 'integer', (col) => col.notNull())
    .addColumn('reference_type', 'varchar')
    .addColumn('reference_id', 'uuid')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_inventory_ledger_audit')
    .on('inventory_ledger')
    .columns(['location_id', 'product_id', 'created_at'])
    .execute();

  // 4. SUPPLIERS
  await db.schema
    .createTable('suppliers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('contact_email', 'varchar')
    .addColumn('lead_time_days', 'integer')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();

  // 5. PURCHASE ORDERS
  await db.schema
    .createTable('purchase_orders')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('po_number', 'varchar', (col) =>
      col
        .notNull()
        .unique()
        .defaultTo(
          sql`concat('PO-', to_char(now(), 'YYYYMMDD'), '-', substr(md5(random()::text), 1, 4))`,
        ),
    )
    .addColumn('supplier_id', 'uuid', (col) =>
      col.references('suppliers.id').onDelete('restrict').notNull(),
    )
    .addColumn('destination_location_id', 'uuid', (col) =>
      col.references('locations.id').onDelete('restrict').notNull(),
    )
    .addColumn('status', 'varchar', (col) => col.notNull().defaultTo('DRAFT'))
    .addColumn('expected_delivery_date', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();

  // 6. PURCHASE ORDER ITEMS
  await db.schema
    .createTable('purchase_order_items')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('po_id', 'uuid', (col) =>
      col.references('purchase_orders.id').onDelete('cascade').notNull(),
    )
    .addColumn('product_id', 'uuid', (col) => col.notNull())
    .addColumn('variant_id', 'uuid')
    .addColumn('quantity_ordered', 'integer', (col) => col.notNull())
    .addColumn('quantity_received', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('unit_cost', 'numeric(12, 4)', (col) => col.notNull())
    .addCheckConstraint('check_qty_ordered_positive', sql`quantity_ordered > 0`)
    .addCheckConstraint('check_unit_cost_positive', sql`unit_cost >= 0`)
    .execute();

  await db.schema
    .createIndex('idx_po_items_po_id')
    .on('purchase_order_items')
    .column('po_id')
    .execute();

  // 7. TRANSFERS
  await db.schema
    .createTable('transfers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('tracking_number', 'varchar', (col) =>
      col
        .notNull()
        .unique()
        .defaultTo(
          sql`concat('TR-', to_char(now(), 'YYYYMMDD'), '-', substr(md5(random()::text), 1, 4))`,
        ),
    )
    .addColumn('source_location_id', 'uuid', (col) =>
      col.references('locations.id').onDelete('restrict').notNull(),
    )
    .addColumn('destination_location_id', 'uuid', (col) =>
      col.references('locations.id').onDelete('restrict').notNull(),
    )
    .addColumn('status', 'varchar', (col) => col.notNull().defaultTo('PENDING'))
    .addColumn('dispatched_at', 'timestamptz')
    .addColumn('received_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    // PREVENT TRANSFER TO SELF
    .addCheckConstraint(
      'check_different_locations',
      sql`source_location_id != destination_location_id`,
    )
    .execute();

  // 8. TRANSFER ITEMS
  await db.schema
    .createTable('transfer_items')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('transfer_id', 'uuid', (col) =>
      col.references('transfers.id').onDelete('cascade').notNull(),
    )
    .addColumn('product_id', 'uuid', (col) => col.notNull())
    .addColumn('variant_id', 'uuid')
    .addColumn('quantity_requested', 'integer', (col) => col.notNull())
    .addColumn('quantity_dispatched', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('quantity_received', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  await db.schema
    .createIndex('idx_transfer_items_transfer_id')
    .on('transfer_items')
    .column('transfer_id')
    .execute();

  // 9. STOCKTAKES
  await db.schema
    .createTable('stocktakes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('location_id', 'uuid', (col) =>
      col.references('locations.id').onDelete('restrict').notNull(),
    )
    .addColumn('status', 'varchar', (col) =>
      col.notNull().defaultTo('IN_PROGRESS'),
    )
    .addColumn('started_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .addColumn('completed_at', 'timestamptz')
    .execute();

  // 10. STOCKTAKE ITEMS
  await db.schema
    .createTable('stocktake_items')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('stocktake_id', 'uuid', (col) =>
      col.references('stocktakes.id').onDelete('cascade').notNull(),
    )
    .addColumn('product_id', 'uuid', (col) => col.notNull())
    .addColumn('variant_id', 'uuid')
    .addColumn('expected_quantity', 'integer', (col) => col.notNull())
    .addColumn('counted_quantity', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('variance', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  // ==========================================
  // INDEXES FOR SOFT REFERENCES (Data Stitching Optimization)
  // ==========================================
  await db.schema
    .createIndex('idx_inventory_levels_product_id')
    .on('inventory_levels')
    .column('product_id')
    .execute();

  await db.schema
    .createIndex('idx_po_items_product_id')
    .on('purchase_order_items')
    .column('product_id')
    .execute();

  await db.schema
    .createIndex('idx_transfer_items_product_id')
    .on('transfer_items')
    .column('product_id')
    .execute();

  await db.schema
    .createIndex('idx_stocktake_items_product_id')
    .on('stocktake_items')
    .column('product_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('stocktake_items').ifExists().execute();
  await db.schema.dropTable('stocktakes').ifExists().execute();
  await db.schema.dropTable('transfer_items').ifExists().execute();
  await db.schema.dropTable('transfers').ifExists().execute();
  await db.schema.dropTable('purchase_order_items').ifExists().execute();
  await db.schema.dropTable('purchase_orders').ifExists().execute();
  await db.schema.dropTable('suppliers').ifExists().execute();
  await db.schema.dropTable('inventory_ledger').ifExists().execute();
  await db.schema.dropTable('inventory_levels').ifExists().execute();
  await db.schema.dropTable('locations').ifExists().execute();
}
