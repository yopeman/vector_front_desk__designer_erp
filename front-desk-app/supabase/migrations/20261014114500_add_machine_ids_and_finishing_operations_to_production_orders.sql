-- ============================================================
-- Vector Front Desk ERP — Production Orders Machines & Finishing Operations
-- Migration: 20261014114500_add_machine_ids_and_finishing_operations_to_production_orders.sql
-- Description: 
--   1. Adds finishing_operations (TEXT[]) for operations like:
--      'Electrical wiring', 'Measurement and installation', 'Welding', 'Quality Finish'
--   2. Adds machine_ids (UUID[]) to support multiple machine assignment
--   3. Backfills machine_ids from existing machine_id
-- ============================================================

-- 1. Add finishing_operations column to production_orders
ALTER TABLE production_orders
    ADD COLUMN IF NOT EXISTS finishing_operations TEXT[] DEFAULT '{}';

COMMENT ON COLUMN production_orders.finishing_operations IS 
    'Array of finishing operations such as: Electrical wiring, Measurement and installation, Welding, Quality Finish';

-- 2. Add machine_ids column to production_orders
ALTER TABLE production_orders
    ADD COLUMN IF NOT EXISTS machine_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN production_orders.machine_ids IS 
    'Array of assigned machine IDs (references machines.id)';

-- 3. Backfill existing machine_id into machine_ids array (if machine_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'production_orders' 
          AND column_name = 'machine_id'
    ) THEN
        UPDATE production_orders
        SET machine_ids = ARRAY[machine_id]
        WHERE machine_id IS NOT NULL 
          AND (machine_ids IS NULL OR cardinality(machine_ids) = 0);
    END IF;
END $$;

-- 4. Create GIN indexes for array containment and search performance
CREATE INDEX IF NOT EXISTS idx_production_orders_machine_ids 
    ON production_orders USING GIN (machine_ids);

CREATE INDEX IF NOT EXISTS idx_production_orders_finishing_operations 
    ON production_orders USING GIN (finishing_operations);
