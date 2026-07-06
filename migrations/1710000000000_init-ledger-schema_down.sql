-- Down Migration: Safely Tearing Down the Schema
DROP INDEX IF EXISTS idx_ledger_entries_transaction_id;
DROP INDEX IF EXISTS idx_ledger_entries_account_date;
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS account_snapshots;