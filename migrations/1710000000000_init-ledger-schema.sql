-- Up Migration: Creating the Ledger Infrastructure

-- 1. Ensure the UUID extension is active for randomized ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the Account Snapshots Table
-- This stores the current, cached, live balance of a wallet.
-- It is optimized for heavy, parallel row-level write locks (SELECT ... FOR UPDATE).
CREATE TABLE account_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0, -- Stored strictly in minor units (cents)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Ledger Entries Table
-- This is an append-only, immutable history log. 
-- Rows in this table can NEVER be updated or deleted by the application layer.
CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY, -- Uses 64-bit auto-incrementing integers for performance positioning
    transaction_id UUID NOT NULL, -- Ties a debit and a credit entry together under one transfer ID
    account_id UUID NOT NULL REFERENCES account_snapshots(id) ON DELETE RESTRICT,
    amount BIGINT NOT NULL, -- Negative value = DEBIT, Positive value = CREDIT
    description VARCHAR(255),
    previous_hash CHAR(64) NOT NULL, -- SHA-256 string from the preceding row link
    current_hash CHAR(64) NOT NULL,  -- Cryptographic verification anchor for this specific row state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enforce Database Indexes for Enterprise-Scale Performance
-- Speeds up our ledger history lookup when reading or paginating an account's transaction log
CREATE INDEX idx_ledger_entries_account_date ON ledger_entries (account_id, created_at DESC);

-- Speeds up matching pairs inside massive financial audit operations
CREATE INDEX idx_ledger_entries_transaction_id ON ledger_entries (transaction_id);