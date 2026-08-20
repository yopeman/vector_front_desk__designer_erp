-- Finance Sync Log Table
-- This table tracks all sync operations from external databases to prevent duplicates

CREATE TABLE IF NOT EXISTS finance_sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     VARCHAR(50) NOT NULL,   -- 'store', 'frontdesk', 'hr'
    source_id       UUID NOT NULL,           -- ID from source database
    sync_type       VARCHAR(50) NOT NULL,   -- 'purchase', 'sale', 'payroll'
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_start    DATE,                    -- For payroll sync
    period_end      DATE,                    -- For payroll sync
    status          VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failed'
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON finance_sync_log(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_type ON finance_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_period ON finance_sync_log(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON finance_sync_log(status);

-- Unique constraint to prevent duplicate successful syncs
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_log_unique 
ON finance_sync_log(source_type, source_id, sync_type, period_start, period_end)
WHERE status = 'success';
