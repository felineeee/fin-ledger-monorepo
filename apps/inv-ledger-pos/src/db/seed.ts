import path from 'node:path';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from './types.js';

// Ensure .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runSeed() {
  console.log('Starting Database Seed Batch...\n');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });

  try {
    // Generate a unique 4-digit batch suffix based on execution timestamp
    const batchSuffix = Date.now().toString().slice(-4);
    const nowIso = new Date().toISOString();

    const ids = {
      product: randomUUID(),
      variantS: randomUUID(),
      warehouse: randomUUID(),
      store: randomUUID(),
      supplier: randomUUID(),
      po: randomUUID(),
      transfer: randomUUID(),
      stocktake: randomUUID(),
      // Dynamic unique identifiers for reconciliation batch safety
      poNumber: `PO-2026-${batchSuffix}`,
      trackingNumber: `TRF-${batchSuffix}`,
    };

    let totalRowsInserted = 0;
    let totalRowsUpdated = 0;

    await db.transaction().execute(async (trx) => {
      // --------------------------------------------------------
      // 1. LOCATIONS
      // --------------------------------------------------------
      const locationsRes = await trx
        .insertInto('locations')
        .values([
          {
            id: ids.warehouse,
            name: 'Main Distribution Center',
            type: 'WAREHOUSE',
            is_active: true,
          },
          {
            id: ids.store,
            name: 'Downtown Retail Store',
            type: 'STORE',
            is_active: true,
          },
        ])
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();

      const locationsCount = Number(
        locationsRes[0]?.numInsertedOrUpdatedRows ?? 0,
      );
      totalRowsInserted += locationsCount;
      console.log(
        `[1/5] Locations: Ensured base locations exist (${locationsCount} new)`,
      );

      // --------------------------------------------------------
      // 2. INVENTORY LEVELS
      // --------------------------------------------------------
      // Initialize or bump stock levels for this run's generated product/variant
      const levelsRes = await trx
        .insertInto('inventory_levels')
        .values([
          {
            id: randomUUID(),
            location_id: ids.warehouse,
            product_id: ids.product,
            variant_id: ids.variantS,
            quantity_on_hand: 100,
            quantity_reserved: 0,
            reorder_point: 20,
          },
          {
            id: randomUUID(),
            location_id: ids.store,
            product_id: ids.product,
            variant_id: ids.variantS,
            quantity_on_hand: 10,
            quantity_reserved: 0,
            reorder_point: 5,
          },
        ])
        .execute();

      const levelsCount = Number(levelsRes[0]?.numInsertedOrUpdatedRows ?? 2);
      totalRowsInserted += levelsCount;
      console.log(
        `[2/5] Inventory Levels: Initialized stock records for Product ${ids.product.slice(0, 8)}...`,
      );

      // --------------------------------------------------------
      // 3. PURCHASE ORDERS (PO Batch)
      // --------------------------------------------------------
      const supplierRes = await trx
        .insertInto('suppliers')
        .values({
          id: ids.supplier,
          name: `Supplier Batch-${batchSuffix}`,
          contact_email: `sales-${batchSuffix}@acmetextiles.com`,
          lead_time_days: 14,
          is_active: true,
        })
        .execute();

      const poRes = await trx
        .insertInto('purchase_orders')
        .values({
          id: ids.po,
          po_number: ids.poNumber, // e.g. PO-2026-4812
          supplier_id: ids.supplier,
          destination_location_id: ids.warehouse,
          status: 'RECEIVED',
        })
        .execute();

      const poItemsRes = await trx
        .insertInto('purchase_order_items')
        .values({
          id: randomUUID(),
          po_id: ids.po,
          product_id: ids.product,
          variant_id: ids.variantS,
          quantity_ordered: 100,
          quantity_received: 100,
          unit_cost: '5.0000',
        })
        .execute();

      const poLedgerRes = await trx
        .insertInto('inventory_ledger')
        .values({
          id: randomUUID(),
          location_id: ids.warehouse,
          product_id: ids.product,
          variant_id: ids.variantS,
          transaction_type: 'RECEIPT',
          quantity_change: 100,
          reference_type: 'PO',
          reference_id: ids.po,
        })
        .execute();

      const phase2Count =
        Number(supplierRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(poRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(poItemsRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(poLedgerRes[0]?.numInsertedOrUpdatedRows ?? 1);
      totalRowsInserted += phase2Count;
      console.log(
        `[3/5] Purchase Orders: Processed ${ids.poNumber} (${phase2Count} records)`,
      );

      // --------------------------------------------------------
      // 4. TRANSFERS (Transfer Batch)
      // --------------------------------------------------------
      const transferRes = await trx
        .insertInto('transfers')
        .values({
          id: ids.transfer,
          tracking_number: ids.trackingNumber, // e.g. TRF-4812
          source_location_id: ids.warehouse,
          destination_location_id: ids.store,
          status: 'COMPLETED',
          dispatched_at: nowIso,
          received_at: nowIso,
        })
        .execute();

      const transferItemsRes = await trx
        .insertInto('transfer_items')
        .values({
          id: randomUUID(),
          transfer_id: ids.transfer,
          product_id: ids.product,
          variant_id: ids.variantS,
          quantity_requested: 10,
          quantity_dispatched: 10,
          quantity_received: 10,
        })
        .execute();

      const transferLedgerRes = await trx
        .insertInto('inventory_ledger')
        .values([
          {
            id: randomUUID(),
            location_id: ids.warehouse,
            product_id: ids.product,
            variant_id: ids.variantS,
            transaction_type: 'TRANSFER_OUT',
            quantity_change: -10,
            reference_type: 'TRANSFER',
            reference_id: ids.transfer,
          },
          {
            id: randomUUID(),
            location_id: ids.store,
            product_id: ids.product,
            variant_id: ids.variantS,
            transaction_type: 'TRANSFER_IN',
            quantity_change: 10,
            reference_type: 'TRANSFER',
            reference_id: ids.transfer,
          },
        ])
        .execute();

      const phase3Count =
        Number(transferRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(transferItemsRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(transferLedgerRes[0]?.numInsertedOrUpdatedRows ?? 2);
      totalRowsInserted += phase3Count;
      console.log(
        `[4/5] Transfers: Processed ${ids.trackingNumber} (${phase3Count} records)`,
      );

      // --------------------------------------------------------
      // 5. STOCKTAKES (Reconciliation Variance Audit)
      // --------------------------------------------------------
      const stocktakeRes = await trx
        .insertInto('stocktakes')
        .values({
          id: ids.stocktake,
          location_id: ids.store,
          status: 'COMPLETED',
          completed_at: nowIso,
        })
        .execute();

      const stocktakeItemsRes = await trx
        .insertInto('stocktake_items')
        .values({
          id: randomUUID(),
          stocktake_id: ids.stocktake,
          product_id: ids.product,
          variant_id: ids.variantS,
          expected_quantity: 10,
          counted_quantity: 9,
          variance: -1,
        })
        .execute();

      const updateRes = await trx
        .updateTable('inventory_levels')
        .set({ quantity_on_hand: 9 })
        .where('location_id', '=', ids.store)
        .where('product_id', '=', ids.product)
        .where('variant_id', '=', ids.variantS)
        .execute();

      const shrinkageLedgerRes = await trx
        .insertInto('inventory_ledger')
        .values({
          id: randomUUID(),
          location_id: ids.store,
          product_id: ids.product,
          variant_id: ids.variantS,
          transaction_type: 'SHRINKAGE',
          quantity_change: -1,
          reference_type: 'STOCKTAKE',
          reference_id: ids.stocktake,
        })
        .execute();

      const phase4Inserts =
        Number(stocktakeRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(stocktakeItemsRes[0]?.numInsertedOrUpdatedRows ?? 1) +
        Number(shrinkageLedgerRes[0]?.numInsertedOrUpdatedRows ?? 1);

      const updatedRows = Number(updateRes[0]?.numUpdatedRows ?? 1);

      totalRowsInserted += phase4Inserts;
      totalRowsUpdated += updatedRows;

      console.log(
        `[5/5] Stocktakes: Recorded cycle count discrepancy (${phase4Inserts} inserts, ${updatedRows} level updated)`,
      );

      console.log('\n----------------------------------------');
      console.log(`Batch Summary (Tag: #${batchSuffix}):`);
      console.log(` - PO Reference      : ${ids.poNumber}`);
      console.log(` - Tracking Ref      : ${ids.trackingNumber}`);
      console.log(` - Total Inserted    : ${totalRowsInserted} rows`);
      console.log(` - Total Updated     : ${totalRowsUpdated} rows`);
      console.log('----------------------------------------');
    });

    console.log('Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

runSeed();
