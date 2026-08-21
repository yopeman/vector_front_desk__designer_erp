-- ==================================================
-- NOTIFICATIONS TABLE
-- ==================================================
CREATE TYPE notification_type AS ENUM (
    'campaign_created',
    'campaign_status_changed',
    'activity_assigned',
    'activity_due_soon',
    'activity_overdue',
    'proposal_submitted',
    'proposal_accepted',
    'proposal_follow_up',
    'proforma_requested',
    'proforma_submitted',
    'proforma_accepted',
    'tender_deadline_soon',
    'tender_submitted',
    'expense_pending_approval',
    'message_received',
    'task_assigned'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ==================================================
-- TRIGGER FUNCTIONS FOR NOTIFICATIONS
-- ==================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- TRIGGERS FOR MAIN ACTIONS
-- ==================================================

-- Campaign created notification
CREATE OR REPLACE FUNCTION notify_campaign_created()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
BEGIN
    target_user_id := COALESCE(NEW.owner_id, auth.uid());
    
    IF target_user_id IS NOT NULL THEN
        PERFORM create_notification(
            target_user_id,
            'campaign_created',
            'New Campaign Created',
            'Campaign "' || NEW.name || '" has been created successfully.',
            '/campaigns',
            jsonb_build_object('campaign_id', NEW.id, 'campaign_name', NEW.name)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_created
    AFTER INSERT ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION notify_campaign_created();

-- Campaign status changed notification
CREATE OR REPLACE FUNCTION notify_campaign_status_changed()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        target_user_id := COALESCE(NEW.owner_id, auth.uid());
        
        IF target_user_id IS NOT NULL THEN
            PERFORM create_notification(
                target_user_id,
                'campaign_status_changed',
                'Campaign Status Changed',
                'Campaign "' || NEW.name || '" status changed from ' || OLD.status || ' to ' || NEW.status,
                '/campaigns',
                jsonb_build_object('campaign_id', NEW.id, 'campaign_name', NEW.name, 'old_status', OLD.status, 'new_status', NEW.status)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_status_changed
    AFTER UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION notify_campaign_status_changed();

-- Activity assigned notification
CREATE OR REPLACE FUNCTION notify_activity_assigned()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
        PERFORM create_notification(
            NEW.assigned_to,
            'activity_assigned',
            'New Activity Assigned',
            'Activity "' || NEW.title || '" has been assigned to you.',
            '/tasks',
            jsonb_build_object('activity_id', NEW.id, 'activity_title', NEW.title)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_assigned
    AFTER INSERT OR UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION notify_activity_assigned();

-- Proposal submitted notification
CREATE OR REPLACE FUNCTION notify_proposal_submitted()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
BEGIN
    IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
        target_user_id := COALESCE(NEW.owner_id, auth.uid());
        
        IF target_user_id IS NOT NULL THEN
            PERFORM create_notification(
                target_user_id,
                'proposal_submitted',
                'Proposal Submitted',
                'Proposal for "' || NEW.client_name || '" has been submitted.',
                '/proposals',
                jsonb_build_object('proposal_id', NEW.id, 'client_name', NEW.client_name)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposal_submitted
    AFTER INSERT OR UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_submitted();

-- Proposal accepted notification
CREATE OR REPLACE FUNCTION notify_proposal_accepted()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
BEGIN
    IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
        target_user_id := COALESCE(NEW.owner_id, auth.uid());
        
        IF target_user_id IS NOT NULL THEN
            PERFORM create_notification(
                target_user_id,
                'proposal_accepted',
                'Proposal Accepted!',
                'Proposal for "' || NEW.client_name || '" has been accepted!',
                '/proposals',
                jsonb_build_object('proposal_id', NEW.id, 'client_name', NEW.client_name)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposal_accepted
    AFTER INSERT OR UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_accepted();

-- Proforma requested notification
CREATE OR REPLACE FUNCTION notify_proforma_requested()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
BEGIN
    IF NEW.status = 'requested' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
        target_user_id := COALESCE(NEW.owner_id, auth.uid());
        
        IF target_user_id IS NOT NULL THEN
            PERFORM create_notification(
                target_user_id,
                'proforma_requested',
                'Proforma Requested',
                'Proforma for "' || NEW.client_name || '" has been requested.',
                '/proformas',
                jsonb_build_object('proforma_id', NEW.id, 'client_name', NEW.client_name)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proforma_requested
    AFTER INSERT OR UPDATE ON proformas
    FOR EACH ROW
    EXECUTE FUNCTION notify_proforma_requested();

-- Expense pending approval notification
CREATE OR REPLACE FUNCTION notify_expense_pending()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
BEGIN
    IF NEW.approval_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
        target_user_id := COALESCE(NEW.submitted_by, auth.uid());
        
        IF target_user_id IS NOT NULL THEN
            -- Notify admin users (you may want to adjust this logic based on your user roles)
            PERFORM create_notification(
                target_user_id,
                'expense_pending_approval',
                'Expense Pending Approval',
                'Expense of $' || NEW.amount || ' is pending approval.',
                '/costs/expenses',
                jsonb_build_object('expense_id', NEW.id, 'amount', NEW.amount)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_pending
    AFTER INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION notify_expense_pending();

-- ==================================================
-- DATE ALARMING TRIGGERS (via scheduled function)
-- ==================================================

-- Function to check for due activities and create notifications
CREATE OR REPLACE FUNCTION check_activity_due_dates()
RETURNS void AS $$
DECLARE
    due_activities RECORD;
BEGIN
    -- Activities due within 24 hours
    FOR due_activities IN 
        SELECT id, title, assigned_to, scheduled_start
        FROM activities
        WHERE assigned_to IS NOT NULL
        AND status NOT IN ('completed', 'overdue')
        AND scheduled_start BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    LOOP
        -- Check if notification already exists for this activity today
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'activity_due_soon' 
            AND metadata->>'activity_id' = due_activities.id::text
            AND created_at > CURRENT_DATE
        ) THEN
            PERFORM create_notification(
                due_activities.assigned_to,
                'activity_due_soon',
                'Activity Due Soon',
                'Activity "' || due_activities.title || '" is due within 24 hours.',
                '/tasks',
                jsonb_build_object('activity_id', due_activities.id, 'activity_title', due_activities.title, 'due_date', due_activities.scheduled_start)
            );
        END IF;
    END LOOP;

    -- Overdue activities
    FOR due_activities IN 
        SELECT id, title, assigned_to, scheduled_start
        FROM activities
        WHERE assigned_to IS NOT NULL
        AND status NOT IN ('completed', 'overdue')
        AND scheduled_start < NOW()
    LOOP
        -- Check if notification already exists for this activity today
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'activity_overdue' 
            AND metadata->>'activity_id' = due_activities.id::text
            AND created_at > CURRENT_DATE
        ) THEN
            -- Update status to overdue
            UPDATE activities SET status = 'overdue' WHERE id = due_activities.id;
            
            PERFORM create_notification(
                due_activities.assigned_to,
                'activity_overdue',
                'Activity Overdue',
                'Activity "' || due_activities.title || '" is now overdue.',
                '/tasks',
                jsonb_build_object('activity_id', due_activities.id, 'activity_title', due_activities.title, 'due_date', due_activities.scheduled_start)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check for tender deadlines
CREATE OR REPLACE FUNCTION check_tender_deadlines()
RETURNS void AS $$
DECLARE
    due_tenders RECORD;
    target_user_id uuid;
BEGIN
    -- Tenders due within 48 hours
    FOR due_tenders IN 
        SELECT id, title, owner_id, deadline
        FROM tenders
        WHERE deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
        AND status NOT IN ('submitted', 'awarded', 'lost')
    LOOP
        target_user_id := COALESCE(due_tenders.owner_id, auth.uid());
        
        IF target_user_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'tender_deadline_soon' 
            AND metadata->>'tender_id' = due_tenders.id::text
            AND created_at > CURRENT_DATE
        ) THEN
            PERFORM create_notification(
                target_user_id,
                'tender_deadline_soon',
                'Tender Deadline Approaching',
                'Tender "' || due_tenders.title || '" deadline is in 2 days.',
                '/tenders',
                jsonb_build_object('tender_id', due_tenders.id, 'tender_title', due_tenders.title, 'deadline', due_tenders.deadline)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check for proposal follow-ups
CREATE OR REPLACE FUNCTION check_proposal_followups()
RETURNS void AS $$
DECLARE
    followup_proposals RECORD;
    target_user_id uuid;
BEGIN
    -- Proposals needing follow-up
    FOR followup_proposals IN 
        SELECT id, client_name, owner_id, follow_up_at
        FROM proposals
        WHERE follow_up_at IS NOT NULL
        AND follow_up_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day'
        AND status = 'submitted'
    LOOP
        target_user_id := COALESCE(followup_proposals.owner_id, auth.uid());
        
        IF target_user_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'proposal_follow_up' 
            AND metadata->>'proposal_id' = followup_proposals.id::text
            AND created_at > CURRENT_DATE
        ) THEN
            PERFORM create_notification(
                target_user_id,
                'proposal_follow_up',
                'Proposal Follow-up Due',
                'Follow-up for proposal to "' || followup_proposals.client_name || '" is due today.',
                '/proposals',
                jsonb_build_object('proposal_id', followup_proposals.id, 'client_name', followup_proposals.client_name, 'follow_up_date', followup_proposals.follow_up_at)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- ENABLE ROW LEVEL SECURITY
-- ==================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can insert notifications (for triggers)
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);
