import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Numeric = ColumnType<string, number | string, number | string>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface InventoryLedger {
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  location_id: string;
  product_id: string;
  quantity_change: number;
  reference_id: string | null;
  reference_type: string | null;
  transaction_type: string;
  variant_id: string | null;
}

export interface InventoryLevels {
  id: Generated<string>;
  location_id: string;
  product_id: string;
  quantity_on_hand: Generated<number>;
  quantity_reserved: Generated<number>;
  reorder_point: number | null;
  updated_at: Generated<Timestamp>;
  variant_id: string | null;
}

export interface Locations {
  address: string | null;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  is_active: Generated<boolean>;
  name: string;
  type: Generated<string>;
}

export interface PurchaseOrderItems {
  id: Generated<string>;
  po_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: Generated<number>;
  unit_cost: Numeric;
  variant_id: string | null;
}

export interface PurchaseOrders {
  created_at: Generated<Timestamp>;
  destination_location_id: string;
  expected_delivery_date: Timestamp | null;
  id: Generated<string>;
  po_number: Generated<string>;
  status: Generated<string>;
  supplier_id: string;
  updated_at: Generated<Timestamp>;
}

export interface StocktakeItems {
  counted_quantity: Generated<number>;
  expected_quantity: number;
  id: Generated<string>;
  product_id: string;
  stocktake_id: string;
  variance: Generated<number>;
  variant_id: string | null;
}

export interface Stocktakes {
  completed_at: Timestamp | null;
  id: Generated<string>;
  location_id: string;
  started_at: Generated<Timestamp>;
  status: Generated<string>;
}

export interface Suppliers {
  contact_email: string | null;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  is_active: Generated<boolean>;
  lead_time_days: number | null;
  name: string;
}

export interface TransferItems {
  id: Generated<string>;
  product_id: string;
  quantity_dispatched: Generated<number>;
  quantity_received: Generated<number>;
  quantity_requested: number;
  transfer_id: string;
  variant_id: string | null;
}

export interface Transfers {
  created_at: Generated<Timestamp>;
  destination_location_id: string;
  dispatched_at: Timestamp | null;
  id: Generated<string>;
  received_at: Timestamp | null;
  source_location_id: string;
  status: Generated<string>;
  tracking_number: Generated<string>;
}

export interface DB {
  inventory_ledger: InventoryLedger;
  inventory_levels: InventoryLevels;
  locations: Locations;
  purchase_order_items: PurchaseOrderItems;
  purchase_orders: PurchaseOrders;
  stocktake_items: StocktakeItems;
  stocktakes: Stocktakes;
  suppliers: Suppliers;
  transfer_items: TransferItems;
  transfers: Transfers;
}
