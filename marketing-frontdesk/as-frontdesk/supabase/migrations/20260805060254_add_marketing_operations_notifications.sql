-- ============================================================
-- Add Notification Triggers for Marketing Operations
-- Migration: 20260803_00017_add_marketing_operations_notifications
-- Description: Adds triggers to automatically create notifications 
--              when main marketing operations occur in the system
--              (market requests, clients, invoices, research, 
--               digital logs, tenders, feedback)
-- ============================================================

-- -----------------------------------------------------------
-- Add missing columns to notifications table if they don't exist
-- -----------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'category'
    ) THEN
        ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN entity_type TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'entity_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN entity_id UUID;
    END IF;
END $$;

-- -----------------------------------------------------------
-- Helper function to create notifications (if not already exists)
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
-- MARKET REQUESTS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new market request
CREATE OR REPLACE FUNCTION notify_new_market_request()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Market Request',
        'Market request #' || NEW.request_no || ' created: ' || NEW.request_type,
        'fa-clipboard-list',
        '#ec4899',
        CASE WHEN NEW.priority = 'high' THEN 'high' ELSE 'normal' END,
        'marketing',
        'market_request',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_market_request_notification
    AFTER INSERT ON public.mrk_market_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_market_request();

-- Trigger for market request status changes (approved/rejected)
CREATE OR REPLACE FUNCTION notify_market_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        PERFORM create_notification(
            NULL,
            'Market Request ' || INITCAP(NEW.status),
            'Market request #' || NEW.request_no || ' has been ' || NEW.status,
            CASE WHEN NEW.status = 'approved' THEN 'fa-check-circle' ELSE 'fa-times-circle' END,
            CASE WHEN NEW.status = 'approved' THEN '#10b981' ELSE '#ef4444' END,
            'high',
            'marketing',
            'market_request',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_market_request_status_notification
    AFTER UPDATE ON public.mrk_market_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_market_request_status_change();

-- -----------------------------------------------------------
-- CLIENTS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new client registration
CREATE OR REPLACE FUNCTION notify_new_marketing_client()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Marketing Client',
        'New client registered: ' || NEW.client_name || ' (' || NEW.client_type || ')',
        'fa-user-plus',
        '#3b82f6',
        'normal',
        'marketing',
        'marketing_client',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_marketing_client_notification
    AFTER INSERT ON public.mrk_clients
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_marketing_client();

-- -----------------------------------------------------------
-- INVOICES TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new invoice creation
CREATE OR REPLACE FUNCTION notify_new_marketing_invoice()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Marketing Invoice',
        'Invoice #' || NEW.invoice_no || ' created for ' || NEW.client_name,
        'fa-file-invoice',
        '#3b82f6',
        'high',
        'marketing',
        'marketing_invoice',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_marketing_invoice_notification
    AFTER INSERT ON public.mrk_invoices
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_marketing_invoice();

-- -----------------------------------------------------------
-- RESEARCH LOGINS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new research login
CREATE OR REPLACE FUNCTION notify_new_research_login()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Research Login',
        'Research #' || NEW.research_no || ' created: ' || NEW.title,
        'fa-flask',
        '#8b5cf6',
        'normal',
        'marketing',
        'research_login',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_research_login_notification
    AFTER INSERT ON public.mrk_research_logins
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_research_login();

-- -----------------------------------------------------------
-- DIGITAL LOGS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new digital content
CREATE OR REPLACE FUNCTION notify_new_digital_content()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Digital Content',
        'Content #' || NEW.content_no || ' created: ' || NEW.content_title,
        'fa-share-nodes',
        '#06b6d4',
        'normal',
        'marketing',
        'digital_log',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_digital_content_notification
    AFTER INSERT ON public.mrk_digital_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_digital_content();

-- -----------------------------------------------------------
-- TENDERS TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new tender
CREATE OR REPLACE FUNCTION notify_new_tender()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Tender',
        'Tender #' || NEW.tender_no || ' created for ' || NEW.company_name,
        'fa-file-contract',
        '#f59e0b',
        'high',
        'marketing',
        'tender',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_tender_notification
    AFTER INSERT ON public.mrk_tenders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_tender();

-- -----------------------------------------------------------
-- FEEDBACK TRIGGERS
-- -----------------------------------------------------------

-- Trigger for new feedback
CREATE OR REPLACE FUNCTION notify_new_feedback()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NULL,
        'New Client Feedback',
        'Feedback received from ' || NEW.client_name || ' - Grade: ' || NEW.grade,
        'fa-star',
        CASE 
            WHEN NEW.grade = 'A' THEN '#10b981'
            WHEN NEW.grade = 'B' THEN '#3b82f6'
            WHEN NEW.grade = 'C' THEN '#f59e0b'
            ELSE '#ef4444'
        END,
        CASE WHEN NEW.grade IN ('A', 'B') THEN 'normal' ELSE 'high' END,
        'marketing',
        'feedback',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_feedback_notification
    AFTER INSERT ON public.mrk_feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_feedback();

-- -----------------------------------------------------------
-- INDEXES FOR NOTIFICATIONS
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_marketing_entity_type_entity_id 
ON notifications(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_marketing_category 
ON notifications(category);

CREATE INDEX IF NOT EXISTS idx_notifications_marketing_priority 
ON notifications(priority);

CREATE INDEX IF NOT EXISTS idx_notifications_marketing_department_null 
ON notifications(department_id) 
WHERE department_id IS NULL;
