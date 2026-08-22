-- ============================================================
-- Add Notification Triggers for Main Operations
-- Migration: 20260803_00015_add_main_operations_notifications
-- Description: Adds columns and triggers to automatically create 
--              notifications when main operations occur in the system
--              (client, designer, front desk, machine operator, system)
-- ============================================================

-- -----------------------------------------------------------
-- Add missing columns if they don't exist
-- -----------------------------------------------------------
DO $$
BEGIN
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;

    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'category'
    ) THEN
        ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    -- Add entity_type column for tracking what entity triggered the notification
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN entity_type TEXT;
    END IF;

    -- Add entity_id column for tracking the specific entity
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'entity_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN entity_id UUID;
    END IF;
END $$;

-- -----------------------------------------------------------
-- Helper function to create notifications
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification(
    p_department_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_icon TEXT,
    p_color TEXT,
    p_priority TEXT DEFAULT 'normal',
    p_category TEXT DEFAULT 'general',
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        department_id, 
        title, 
        body, 
        icon, 
        color, 
        priority, 
        category,
        entity_type,
        entity_id
    ) VALUES (
        p_department_id,
        p_title,
        p_body,
        p_icon,
        p_color,
        p_priority,
        p_category,
        p_entity_type,
        p_entity_id
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------
-- CLIENT OPERATIONS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new lead/client creation
CREATE OR REPLACE FUNCTION notify_new_client()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New ' || NEW.client_type,
        'New ' || NEW.client_type || ' added: ' || NEW.name,
        CASE WHEN NEW.client_type = 'lead' THEN 'fa-user-plus' ELSE 'fa-users' END,
        '#3b82f6',
        'normal',
        'front_desk',
        'client',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_client_notification
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_client();

-- Trigger for new order creation
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
BEGIN
    SELECT name INTO v_client_name FROM clients WHERE id = NEW.client_id;
    
    PERFORM create_notification(
        NEW.department_id,
        'New Order Created',
        'Order #' || COALESCE(NEW.order_no, 'Draft') || ' created for ' || COALESCE(v_client_name, 'Unknown'),
        'fa-clipboard-list',
        '#3b82f6',
        'high',
        'front_desk',
        'order',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_order_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

-- Trigger for order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT name INTO v_client_name FROM clients WHERE id = NEW.client_id;
        
        PERFORM create_notification(
            NEW.department_id,
            'Order Status Updated',
            'Order #' || COALESCE(NEW.order_no, 'Draft') || ' status changed from ' || OLD.status || ' to ' || NEW.status,
            'fa-clipboard-list',
            CASE 
                WHEN NEW.status = 'Completed' THEN '#10b981'
                WHEN NEW.status = 'Cancelled' THEN '#ef4444'
                WHEN NEW.status = 'In Production' THEN '#f59e0b'
                ELSE '#3b82f6'
            END,
            CASE 
                WHEN NEW.status IN ('Completed', 'Cancelled') THEN 'high'
                ELSE 'normal'
            END,
            'front_desk',
            'order',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_status_notification
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change();

-- -----------------------------------------------------------
-- DESIGNER OPERATIONS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new design request
CREATE OR REPLACE FUNCTION notify_new_design()
RETURNS TRIGGER AS $$
DECLARE
    v_order_no TEXT;
BEGIN
    SELECT order_no INTO v_order_no FROM orders WHERE id = NEW.order_id;
    
    PERFORM create_notification(
        NULL,
        'New Design Request',
        'Design request created for order #' || COALESCE(v_order_no, 'Unknown'),
        'fa-pen-ruler',
        '#ec4899',
        'high',
        'designer',
        'design',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_design_notification
    AFTER INSERT ON designs
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_design();

-- Trigger for design status changes
CREATE OR REPLACE FUNCTION notify_design_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM create_notification(
            NULL,
            'Design Status Updated',
            'Design status changed from ' || OLD.status || ' to ' || NEW.status,
            'fa-pen-ruler',
            CASE 
                WHEN NEW.status = 'Completed' THEN '#10b981'
                WHEN NEW.status = 'Cancelled' THEN '#ef4444'
                WHEN NEW.status = 'In Progress' THEN '#f59e0b'
                ELSE '#ec4899'
            END,
            CASE 
                WHEN NEW.status IN ('Completed', 'Cancelled') THEN 'high'
                ELSE 'normal'
            END,
            'designer',
            'design',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_design_status_notification
    AFTER UPDATE ON designs
    FOR EACH ROW
    EXECUTE FUNCTION notify_design_status_change();

-- Trigger for design version submission (sent to customer)
CREATE OR REPLACE FUNCTION notify_design_version_sent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Sent' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        PERFORM create_notification(
            NULL,
            'Design Version Sent',
            'Design version #' || NEW.version_number || ' sent for customer review',
            'fa-paper-plane',
            '#ec4899',
            'high',
            'designer',
            'design_version',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_design_version_sent_notification
    AFTER INSERT OR UPDATE ON design_versions
    FOR EACH ROW
    EXECUTE FUNCTION notify_design_version_sent();

-- Trigger for design version approval
CREATE OR REPLACE FUNCTION notify_design_version_approved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Approved' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        PERFORM create_notification(
            NULL,
            'Design Approved',
            'Design version #' || NEW.version_number || ' has been approved by customer',
            'fa-check-circle',
            '#10b981',
            'high',
            'designer',
            'design_version',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_design_version_approved_notification
    AFTER INSERT OR UPDATE ON design_versions
    FOR EACH ROW
    EXECUTE FUNCTION notify_design_version_approved();

-- -----------------------------------------------------------
-- FRONT DESK OPERATIONS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new invoice creation
CREATE OR REPLACE FUNCTION notify_new_invoice()
RETURNS TRIGGER AS $$
DECLARE
    v_order_no TEXT;
BEGIN
    SELECT order_no INTO v_order_no FROM orders WHERE id = NEW.order_id;
    
    PERFORM create_notification(
        NULL,
        'New ' || NEW.invoice_type,
        NEW.invoice_type || ' #' || COALESCE(NEW.invoice_no, 'Draft') || ' created for order #' || COALESCE(v_order_no, 'Unknown'),
        'fa-file-invoice',
        '#3b82f6',
        'high',
        'front_desk',
        'invoice',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_invoice_notification
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_invoice();

-- Trigger for payment received
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_no TEXT;
BEGIN
    SELECT invoice_no INTO v_invoice_no FROM invoices WHERE id = NEW.invoice_id;
    
    PERFORM create_notification(
        NULL,
        'Payment Received',
        'Payment of ' || NEW.amount_paid || ' received for invoice #' || COALESCE(v_invoice_no, 'Unknown'),
        'fa-credit-card',
        '#10b981',
        'high',
        'front_desk',
        'payment',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_notification
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_received();

-- Trigger for new complaint
CREATE OR REPLACE FUNCTION notify_new_complaint()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Complaint Filed',
        'Complaint: ' || NEW.subject || ' from client',
        'fa-triangle-exclamation',
        '#ef4444',
        'high',
        'front_desk',
        'complaint',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_complaint_notification
    AFTER INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_complaint();

-- -----------------------------------------------------------
-- MACHINE OPERATIONS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new production order
CREATE OR REPLACE FUNCTION notify_new_production_order()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Production Order',
        'Production order created: ' || COALESCE(NEW.task_type, 'Task'),
        'fa-industry',
        '#8b5cf6',
        'high',
        'machine_ops',
        'production_order',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_production_order_notification
    AFTER INSERT ON production_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_production_order();

-- Trigger for production order status changes
CREATE OR REPLACE FUNCTION notify_production_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM create_notification(
            NULL,
            'Production Order Status Updated',
            'Production order status changed from ' || OLD.status || ' to ' || NEW.status,
            'fa-industry',
            CASE 
                WHEN NEW.status = 'Completed' THEN '#10b981'
                WHEN NEW.status = 'Cancelled' THEN '#ef4444'
                WHEN NEW.status = 'In Progress' THEN '#f59e0b'
                ELSE '#8b5cf6'
            END,
            CASE 
                WHEN NEW.status IN ('Completed', 'Cancelled') THEN 'high'
                ELSE 'normal'
            END,
            'machine_ops',
            'production_order',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_production_order_status_notification
    AFTER UPDATE ON production_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_production_order_status_change();

-- Trigger for rework order creation
CREATE OR REPLACE FUNCTION notify_new_rework()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_type = 'rework' THEN
        PERFORM create_notification(
            NULL,
            'New Rework Order',
            'Rework order created: ' || COALESCE(NEW.rework_reason, 'No reason specified'),
            'fa-rotate-left',
            '#ef4444',
            'high',
            'machine_ops',
            'production_order',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_rework_notification
    AFTER INSERT ON production_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_rework();

-- -----------------------------------------------------------
-- Create indexes for performance
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type_entity_id 
ON notifications(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON notifications(category);

CREATE INDEX IF NOT EXISTS idx_notifications_priority 
ON notifications(priority);

CREATE INDEX IF NOT EXISTS idx_notifications_department_null 
ON notifications(department_id) 
WHERE department_id IS NULL;
