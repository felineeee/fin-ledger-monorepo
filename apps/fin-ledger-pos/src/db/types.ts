import type { ColumnType } from "kysely";

export type DisputeStatus = "LOST" | "PENDING" | "WON";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = ColumnType<JsonValue, string, string>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type LedgerEntryType = "AUTHORIZED" | "CAPTURED" | "DISPUTED" | "FEE_DEDUCTED" | "PAYMENT_CREATED" | "REFUNDED" | "TIP_ADDED" | "VOIDED";

export type Numeric = ColumnType<string, number | string, number | string>;

export type PaymentChannel = "IN_PERSON" | "ONLINE";

export type PaymentMethodType = "CARD" | "CASH" | "QRIS" | "VIRTUAL_ACCOUNT" | "WALLET";

export type PaymentStatus = "AUTHORIZED" | "CAPTURED" | "FAILED" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "VOIDED";

export type RefundStatus = "COMPLETED" | "FAILED" | "PENDING";

export type SettlementStatus = "FAILED" | "PAID" | "PENDING";

export type ShiftStatus = "CLOSED" | "FORCE_CLOSED" | "OPEN";

export type TerminalStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface CashDrops {
  amount: Numeric;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  recorded_by: string;
  shift_id: string;
}

export interface DailyReconciliations {
  closed_at: Generated<Timestamp>;
  id: Generated<string>;
  location_id: string;
  notes: string | null;
  reconciliation_date: Timestamp;
  total_cash_drops: Generated<Numeric>;
  total_ending_cash_actual: Generated<Numeric>;
  total_opening_float: Generated<Numeric>;
  total_shifts: Generated<number>;
  total_variance: Generated<Numeric>;
}

export interface Disputes {
  amount: Numeric;
  created_at: Generated<Timestamp>;
  evidence_text: string | null;
  evidence_url: string | null;
  id: Generated<string>;
  payment_id: string;
  status: Generated<DisputeStatus>;
  updated_at: Generated<Timestamp>;
}

export interface FeeSchedules {
  channel_code: string | null;
  created_at: Generated<Timestamp>;
  flat_fee: Generated<Numeric>;
  id: Generated<string>;
  is_active: Generated<boolean>;
  max_fee: Numeric | null;
  min_fee: Numeric | null;
  payment_method_id: string;
  percentage_fee: Generated<Numeric>;
  updated_at: Generated<Timestamp>;
  vat_rate: Generated<Numeric | null>;
}

export interface PaymentLedger {
  amount: Numeric;
  created_at: Generated<Timestamp>;
  currency: Generated<string>;
  entry_type: LedgerEntryType;
  id: Generated<string>;
  metadata: Generated<Json | null>;
  payment_id: string;
}

export interface PaymentMethods {
  config: Generated<Json | null>;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  is_active: Generated<boolean>;
  name: string;
  provider: Generated<string>;
  type: PaymentMethodType;
}

export interface Payments {
  amount: Numeric;
  channel: PaymentChannel;
  created_at: Generated<Timestamp>;
  currency: Generated<string>;
  fee_schedule_id: string | null;
  id: Generated<string>;
  idempotency_key: string | null;
  location_id: string | null;
  net_payout: Numeric | null;
  order_id: string;
  payment_method_id: string;
  shift_id: string | null;
  snap_flat_fee: Numeric | null;
  snap_percentage_fee: Numeric | null;
  snap_vat_rate: Numeric | null;
  status: Generated<PaymentStatus>;
  terminal_id: string | null;
  tip_amount: Generated<Numeric>;
  total_fee_deducted: Numeric | null;
  updated_at: Generated<Timestamp>;
}

export interface Refunds {
  amount: Numeric;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  payment_id: string;
  reason: string | null;
  status: Generated<RefundStatus>;
  updated_at: Generated<Timestamp>;
}

export interface Settlements {
  amount: Numeric;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  provider: string;
  settled_at: Timestamp | null;
  status: Generated<SettlementStatus>;
  updated_at: Generated<Timestamp>;
}

export interface Shifts {
  cashier_id: string;
  closed_at: Timestamp | null;
  ending_cash_actual: Numeric | null;
  ending_cash_expected: Numeric | null;
  id: Generated<string>;
  location_id: string;
  opened_at: Generated<Timestamp>;
  starting_float: Generated<Numeric>;
  status: Generated<ShiftStatus>;
  total_cash_drops: Generated<Numeric | null>;
  variance: Numeric | null;
}

export interface Terminals {
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  location_id: string;
  name: string;
  serial_number: string | null;
  status: Generated<TerminalStatus>;
}

export interface WebhookEvents {
  created_at: Generated<Timestamp>;
  event_id: string;
  event_type: string;
  id: Generated<string>;
  payload: Json;
  payment_id: string | null;
}

export interface DB {
  cash_drops: CashDrops;
  daily_reconciliations: DailyReconciliations;
  disputes: Disputes;
  fee_schedules: FeeSchedules;
  payment_ledger: PaymentLedger;
  payment_methods: PaymentMethods;
  payments: Payments;
  refunds: Refunds;
  settlements: Settlements;
  shifts: Shifts;
  terminals: Terminals;
  webhook_events: WebhookEvents;
}
