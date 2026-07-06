-- 1. Drop the strict unique constraint on user_id
ALTER TABLE account_snapshots DROP CONSTRAINT IF EXISTS account_snapshots_user_id_key;

-- 2. Add a 'type' column to differentiate wallet allocations
ALTER TABLE account_snapshots ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'primary';

-- 3. Add a composite index so a user can rapidly scan all their sub-wallets
CREATE INDEX idx_account_snapshots_user_type ON account_snapshots (user_id, type);