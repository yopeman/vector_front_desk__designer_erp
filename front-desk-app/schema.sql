


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "finance";


ALTER SCHEMA "finance" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "finance"."account_type" AS ENUM (
    'Asset',
    'Liability',
    'Equity',
    'Revenue',
    'Expense'
);


ALTER TYPE "finance"."account_type" OWNER TO "postgres";


CREATE TYPE "finance"."journal_status" AS ENUM (
    'Draft',
    'Posted'
);


ALTER TYPE "finance"."journal_status" OWNER TO "postgres";


CREATE TYPE "finance"."payroll_status" AS ENUM (
    'Draft',
    'Approved',
    'Paid'
);


ALTER TYPE "finance"."payroll_status" OWNER TO "postgres";


CREATE TYPE "finance"."purchase_type" AS ENUM (
    'Cash',
    'Credit'
);


ALTER TYPE "finance"."purchase_type" OWNER TO "postgres";


CREATE TYPE "finance"."receipt_source" AS ENUM (
    'Manual',
    'FS'
);


ALTER TYPE "finance"."receipt_source" OWNER TO "postgres";


CREATE TYPE "finance"."sales_type" AS ENUM (
    'Cash',
    'Credit'
);


ALTER TYPE "finance"."sales_type" OWNER TO "postgres";


CREATE TYPE "finance"."vat_type" AS ENUM (
    'VAT',
    'Exempted'
);


ALTER TYPE "finance"."vat_type" OWNER TO "postgres";


CREATE TYPE "finance"."vat_withholding" AS ENUM (
    'No Withholding',
    '3%',
    '7.5%',
    '30%'
);


ALTER TYPE "finance"."vat_withholding" OWNER TO "postgres";


CREATE TYPE "public"."activity_status" AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'overdue'
);


ALTER TYPE "public"."activity_status" OWNER TO "postgres";


CREATE TYPE "public"."activity_type" AS ENUM (
    'content_production',
    'social_media',
    'website',
    'paid_ad',
    'visit',
    'meeting',
    'demo',
    'event',
    'follow_up',
    'other'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status" AS ENUM (
    'planned',
    'active',
    'completed',
    'on_hold',
    'archived'
);


ALTER TYPE "public"."campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."client_level" AS ENUM (
    'standard',
    'premium'
);


ALTER TYPE "public"."client_level" OWNER TO "postgres";


CREATE TYPE "public"."client_type" AS ENUM (
    'organization',
    'personal'
);


ALTER TYPE "public"."client_type" OWNER TO "postgres";


CREATE TYPE "public"."expense_category" AS ENUM (
    'advertising',
    'content',
    'events',
    'travel',
    'software',
    'personnel',
    'other'
);


ALTER TYPE "public"."expense_category" OWNER TO "postgres";


CREATE TYPE "public"."finance_account_type" AS ENUM (
    'Asset',
    'Liability',
    'Equity',
    'Revenue',
    'Expense'
);


ALTER TYPE "public"."finance_account_type" OWNER TO "postgres";


CREATE TYPE "public"."finance_journal_status" AS ENUM (
    'Draft',
    'Posted'
);


ALTER TYPE "public"."finance_journal_status" OWNER TO "postgres";


CREATE TYPE "public"."finance_payroll_status" AS ENUM (
    'Draft',
    'Approved',
    'Paid'
);


ALTER TYPE "public"."finance_payroll_status" OWNER TO "postgres";


CREATE TYPE "public"."finance_purchase_type" AS ENUM (
    'Cash',
    'Credit'
);


ALTER TYPE "public"."finance_purchase_type" OWNER TO "postgres";


CREATE TYPE "public"."finance_receipt_source" AS ENUM (
    'Manual',
    'FS'
);


ALTER TYPE "public"."finance_receipt_source" OWNER TO "postgres";


CREATE TYPE "public"."finance_sales_type" AS ENUM (
    'Cash',
    'Credit'
);


ALTER TYPE "public"."finance_sales_type" OWNER TO "postgres";


CREATE TYPE "public"."finance_vat_type" AS ENUM (
    'VAT',
    'Exempted'
);


ALTER TYPE "public"."finance_vat_type" OWNER TO "postgres";


CREATE TYPE "public"."finance_vat_withholding" AS ENUM (
    'No Withholding',
    '3%',
    '7.5%',
    '30%'
);


ALTER TYPE "public"."finance_vat_withholding" OWNER TO "postgres";


CREATE TYPE "public"."insight_type" AS ENUM (
    'customer_need',
    'competitor',
    'market_trend',
    'new_opportunity'
);


ALTER TYPE "public"."insight_type" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."proforma_status" AS ENUM (
    'requested',
    'submitted',
    'follow_up',
    'accepted',
    'rejected',
    'on_hold'
);


ALTER TYPE "public"."proforma_status" OWNER TO "postgres";


CREATE TYPE "public"."proposal_status" AS ENUM (
    'draft',
    'submitted',
    'follow_up',
    'accepted',
    'rejected',
    'on_hold'
);


ALTER TYPE "public"."proposal_status" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."share_target" AS ENUM (
    'marketing_manager',
    'management'
);


ALTER TYPE "public"."share_target" OWNER TO "postgres";


CREATE TYPE "public"."tender_status" AS ENUM (
    'opportunity',
    'preparation',
    'submitted',
    'follow_up',
    'awarded',
    'lost',
    'on_hold'
);


ALTER TYPE "public"."tender_status" OWNER TO "postgres";


CREATE TYPE "public"."vat_status" AS ENUM (
    'with_vat',
    'without_vat'
);


ALTER TYPE "public"."vat_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "finance"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_inventory_movement"("p_inventory_id" "uuid", "p_user_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_reference_type" "text", "p_notes" "text") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_new_qty numeric;
begin
  if p_movement_type not in ('in', 'out') then
    raise exception 'Invalid movement_type: %', p_movement_type;
  end if;

  insert into public.inventory_movements
    (inventory_id, movement_type, quantity, reference_type, performed_by, notes)
  values
    (p_inventory_id, p_movement_type, p_quantity, p_reference_type, p_user_id, p_notes);

  update public.inventory
     set current_quantity = coalesce(current_quantity, 0) + p_quantity
   where id = p_inventory_id
  returning current_quantity into v_new_qty;

  if v_new_qty is null then
    raise exception 'Inventory item % not found', p_inventory_id;
  end if;

  return v_new_qty;
end;
$$;


ALTER FUNCTION "public"."apply_inventory_movement"("p_inventory_id" "uuid", "p_user_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_reference_type" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text" DEFAULT 'normal'::"text", "p_category" "text" DEFAULT 'general'::"text", "p_entity_type" "text" DEFAULT NULL::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select role from public.users where id = auth.uid();
$$;


ALTER FUNCTION "public"."current_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finance_update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."finance_update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce((select role from public.users where id = auth.uid()) in ('admin', 'admin_marketer'), false);
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_ai_attachments"("session_uuid" "uuid", "query_embedding" "public"."vector", "match_count" integer DEFAULT 5) RETURNS TABLE("chunk_id" "uuid", "attachment_id" "uuid", "file_name" "text", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
begin
    return query
    select
        c.id,
        c.attachment_id,
        a.name,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity
    from
        public.ai_attachment_chunks c
    join
        public.ai_attachments a on a.id = c.attachment_id
    where
        a.session_id = session_uuid
    order by (c.embedding <=> query_embedding)
    limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_ai_attachments"("session_uuid" "uuid", "query_embedding" "public"."vector", "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_design_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_design_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_design_version_approved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_design_version_approved"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_design_version_sent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_design_version_sent"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_market_request_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_market_request_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_client"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_complaint"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_complaint"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_design"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_design"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_digital_content"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_digital_content"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_feedback"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_feedback"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_market_request"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_market_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_marketing_client"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_marketing_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_marketing_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_marketing_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_production_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_production_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_research_login"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_research_login"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_rework"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_rework"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_tender"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_new_tender"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_order_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_payment_received"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_payment_received"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_production_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_production_order_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stamp_market_request_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.status <> old.status and new.status in ('approved', 'rejected') then
    new.approved_by = auth.uid();
    new.approved_at = now();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."stamp_market_request_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_push_devices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_push_devices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "finance"."finance_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_type" character varying(50) NOT NULL,
    "source_id" "uuid" NOT NULL,
    "sync_type" character varying(50) NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "period_start" "date",
    "period_end" "date",
    "status" character varying(20) DEFAULT 'success'::character varying NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "finance"."finance_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."gl_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_code" character varying(20) NOT NULL,
    "account_name" character varying(255) NOT NULL,
    "account_type" "finance"."account_type" NOT NULL,
    "parent_id" "uuid",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "finance"."gl_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."journal_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_id" "uuid" NOT NULL,
    "gl_account_id" "uuid" NOT NULL,
    "description" "text",
    "debit" numeric(15,2) DEFAULT 0 NOT NULL,
    "credit" numeric(15,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "journal_lines_credit_check" CHECK (("credit" >= (0)::numeric)),
    CONSTRAINT "journal_lines_debit_check" CHECK (("debit" >= (0)::numeric))
);


ALTER TABLE "finance"."journal_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_no" character varying(50) NOT NULL,
    "journal_date" "date" NOT NULL,
    "reference" character varying(100),
    "description" "text",
    "status" "finance"."journal_status" DEFAULT 'Draft'::"finance"."journal_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "finance"."journals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "basic_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "transport_allowance" numeric(15,2) DEFAULT 0 NOT NULL,
    "telephone_allowance" numeric(15,2) DEFAULT 0 NOT NULL,
    "overtime" numeric(15,2) DEFAULT 0 NOT NULL,
    "other_earnings" numeric(15,2) DEFAULT 0 NOT NULL,
    "gross_salary" numeric(15,2) GENERATED ALWAYS AS ((((("basic_salary" + "transport_allowance") + "telephone_allowance") + "overtime") + "other_earnings")) STORED,
    "taxable_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "income_tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "pension_employee" numeric(15,2) DEFAULT 0 NOT NULL,
    "pension_employer" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_deductions" numeric(15,2) DEFAULT 0 NOT NULL,
    "net_pay" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" "finance"."payroll_status" DEFAULT 'Draft'::"finance"."payroll_status" NOT NULL,
    "payment_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "finance"."payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."purchase_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "quantity" numeric(15,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "total" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "gl_account_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "purchase_items_quantity_check" CHECK (("quantity" >= (0)::numeric)),
    CONSTRAINT "purchase_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "finance"."purchase_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_no" character varying(50) NOT NULL,
    "purchase_type" "finance"."purchase_type" NOT NULL,
    "seller_tin" character varying(50),
    "seller_name" character varying(255) NOT NULL,
    "seller_id" "uuid",
    "purchase_date" "date" NOT NULL,
    "receipt_source" "finance"."receipt_source" NOT NULL,
    "reference_no" character varying(100),
    "gl_account_id" "uuid" NOT NULL,
    "vat_type" "finance"."vat_type" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "vat_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" character varying(50) DEFAULT 'Draft'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "finance"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_no" character varying(50) NOT NULL,
    "sales_type" "finance"."sales_type" NOT NULL,
    "sales_category" character varying(50) NOT NULL,
    "cash_received" numeric(15,2) DEFAULT 0,
    "customer_tin" character varying(50),
    "customer_name" character varying(255) NOT NULL,
    "customer_id" "uuid",
    "sales_date" "date" NOT NULL,
    "receipt_source" "finance"."receipt_source" NOT NULL,
    "vat_withholding" "finance"."vat_withholding" DEFAULT 'No Withholding'::"finance"."vat_withholding" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "vat_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "withholding_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "net_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" character varying(50) DEFAULT 'Draft'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "finance"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."sales_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 15.00,
    "total" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "gl_account_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sales_items_quantity_check" CHECK (("quantity" >= (0)::numeric)),
    CONSTRAINT "sales_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "finance"."sales_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."tax_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tax_type" character varying(50) NOT NULL,
    "rate" numeric(5,2) NOT NULL,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "finance"."tax_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_attachment_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attachment_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_attachment_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "mime_type" "text",
    "file_size" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_chats_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New chat'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ai_sessions"."user_id" IS 'References the ERP users.id (or auth.users.id)';



CREATE TABLE IF NOT EXISTS "public"."client_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_type" "text",
    "name" "text" NOT NULL,
    "company_name" "text",
    "phone" "text",
    "email" "text",
    "alt_email" "text",
    "address" "text",
    "city" "text",
    "subcity" "text",
    "woreda" "text",
    "region" "text",
    "po_box" "text",
    "type" "text",
    "industry" "text",
    "website" "text",
    "description" "text",
    "point_of_contact" "text",
    "priority" "text",
    "source" "text",
    "source_heard" "text",
    "budget" numeric,
    "timeframe" "text",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "assigned_sales_officer_id" "uuid",
    "followup_date" "date",
    "tin" "text",
    "vat_number" "text",
    "reg_number" "text",
    "date_established" "date",
    "credit_limit" numeric DEFAULT 0,
    "payment_terms" "text",
    "currency" "text" DEFAULT 'ETB'::"text",
    "opening_balance" numeric DEFAULT 0,
    "total_orders" integer DEFAULT 0,
    "total_sales" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "loyalty_level" "text",
    "account_manager" "text",
    "referral_source" "text",
    "status" "text" DEFAULT 'New'::"text",
    "registered_on" "date",
    "converted_at" timestamp with time zone,
    "document_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "allow_self_update" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clients_client_type_check" CHECK (("client_type" = ANY (ARRAY['lead'::"text", 'client'::"text"]))),
    CONSTRAINT "clients_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'Active'::"text", 'Inactive'::"text", 'Converted'::"text", 'Lost'::"text", 'Prospective'::"text"]))),
    CONSTRAINT "clients_type_check" CHECK (("type" = ANY (ARRAY['Corporate'::"text", 'Individual'::"text", 'Government'::"text"])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "order_ref" "text",
    "category" "text",
    "severity" "text",
    "subject" "text",
    "description" "text",
    "attachments" "uuid"[] DEFAULT '{}'::"uuid"[],
    "assigned_to" "text",
    "resolution" "text",
    "status" "text" DEFAULT 'New'::"text",
    "sla_breached" boolean DEFAULT false,
    "logged_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "complaints_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'In Progress'::"text", 'Resolved'::"text", 'Closed'::"text"])))
);


ALTER TABLE "public"."complaints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crt_design_bom" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_date" "date" NOT NULL,
    "design_reference" "text" NOT NULL,
    "project_title" "text" NOT NULL,
    "priority" "text" DEFAULT 'Normal'::"text" NOT NULL,
    "machine_routes" "text"[] NOT NULL,
    "bom_item" "text" NOT NULL,
    "bom_quantity" integer DEFAULT 1 NOT NULL,
    "total_price" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'Ready'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text_message" "text",
    "voice_note" "text",
    "voice_note_url" "text",
    "attached_file" "text",
    "attached_file_url" "text",
    "model_3d_file" "text",
    "model_3d_url" "text",
    "finishing_file" "text",
    "finishing_url" "text"
);


ALTER TABLE "public"."crt_design_bom" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crt_idea_hub" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_date" "date" NOT NULL,
    "idea_code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "source" "text" NOT NULL,
    "priority" "text" DEFAULT 'Normal'::"text" NOT NULL,
    "target_date" "date" NOT NULL,
    "estimated_cost" numeric NOT NULL,
    "status" "text" DEFAULT 'Under Review'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "attached_file" "text",
    "attached_file_url" "text"
);


ALTER TABLE "public"."crt_idea_hub" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crt_prototype_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_date" "date" NOT NULL,
    "request_number" "text" NOT NULL,
    "department" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" "text" DEFAULT 'Normal'::"text" NOT NULL,
    "deadline" "date" NOT NULL,
    "assigned_technologist" "text" NOT NULL,
    "status" "text" DEFAULT 'On Progress'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start_time" "text",
    "end_time" "text",
    "text_message" "text",
    "voice_note" "text",
    "voice_note_url" "text",
    "attached_file" "text",
    "attached_file_url" "text"
);


ALTER TABLE "public"."crt_prototype_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crt_staff_leaves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_date" "date" NOT NULL,
    "leave_id" "text" NOT NULL,
    "employee_name" "text" NOT NULL,
    "leave_from" "date" NOT NULL,
    "leave_to" "date" NOT NULL,
    "leave_type" "text" NOT NULL,
    "justification" "text" NOT NULL,
    "status" "text" DEFAULT 'Under Review'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text_message" "text",
    "voice_note" "text",
    "voice_note_url" "text",
    "attached_file" "text",
    "attached_file_url" "text"
);


ALTER TABLE "public"."crt_staff_leaves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_order_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "delivery_no" "text",
    "company" "text",
    "delivery_address" "text",
    "contact_person" "text",
    "contact_phone" "text",
    "items" "text" DEFAULT '[]'::"jsonb",
    "vehicle_driver" "text",
    "scheduled_date" "date",
    "scheduled_time" time without time zone,
    "actual_delivery_time" timestamp with time zone,
    "status" "text" DEFAULT 'Pending'::"text",
    "received_by" "text",
    "logged_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "note" "text",
    CONSTRAINT "deliveries_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'In Transit'::"text", 'Delivered'::"text", 'Delayed'::"text"])))
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."design_communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid",
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."design_communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."design_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_id" "uuid" NOT NULL,
    "file_id" "uuid",
    "version_number" integer NOT NULL,
    "description" "text",
    "sent_on" timestamp with time zone,
    "sent_by" "text",
    "status" "text" DEFAULT 'Sent'::"text",
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "design_versions_status_check" CHECK (("status" = ANY (ARRAY['Sent'::"text", 'Reviewed'::"text", 'Approved'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."design_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."designs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "design_type" "text",
    "purpose" "text",
    "requested_date" "date",
    "required_date" "date",
    "priority" "text" DEFAULT 'Medium'::"text",
    "status" "text" DEFAULT 'Pending'::"text",
    "assigned_designer_id" "uuid",
    "requested_by" "text",
    "brief_dimensions" "text",
    "specifications" "text",
    "special_instructions" "text",
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "internal_notes" "text",
    CONSTRAINT "designs_priority_check" CHECK (("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text"]))),
    CONSTRAINT "designs_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."designs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "overall_rating" "text",
    "delivery_rating" "text",
    "quality_rating" "text",
    "staff_service_rating" "text",
    "recommend" "text",
    "comments" "text",
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedbacks_overall_rating_check" CHECK (("overall_rating" = ANY (ARRAY['Excellent'::"text", 'Good'::"text", 'Average'::"text", 'Poor'::"text"]))),
    CONSTRAINT "feedbacks_recommend_check" CHECK (("recommend" = ANY (ARRAY['Yes'::"text", 'No'::"text"])))
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "path" "text" NOT NULL,
    "mime_type" "text",
    "file_size" bigint,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_gl_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_code" character varying(20) NOT NULL,
    "account_name" character varying(255) NOT NULL,
    "account_type" "public"."finance_account_type" NOT NULL,
    "parent_id" "uuid",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "items" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."finance_gl_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_journal_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_id" "uuid" NOT NULL,
    "gl_account_id" "uuid" NOT NULL,
    "description" "text",
    "debit" numeric(15,2) DEFAULT 0 NOT NULL,
    "credit" numeric(15,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "finance_journal_lines_credit_check" CHECK (("credit" >= (0)::numeric)),
    CONSTRAINT "finance_journal_lines_debit_check" CHECK (("debit" >= (0)::numeric))
);


ALTER TABLE "public"."finance_journal_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_no" character varying(50) NOT NULL,
    "journal_date" "date" NOT NULL,
    "reference" character varying(100),
    "description" "text",
    "status" "public"."finance_journal_status" DEFAULT 'Draft'::"public"."finance_journal_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."finance_journals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "basic_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "transport_allowance" numeric(15,2) DEFAULT 0 NOT NULL,
    "telephone_allowance" numeric(15,2) DEFAULT 0 NOT NULL,
    "overtime" numeric(15,2) DEFAULT 0 NOT NULL,
    "other_earnings" numeric(15,2) DEFAULT 0 NOT NULL,
    "gross_salary" numeric(15,2) GENERATED ALWAYS AS ((((("basic_salary" + "transport_allowance") + "telephone_allowance") + "overtime") + "other_earnings")) STORED,
    "taxable_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "income_tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "pension_employee" numeric(15,2) DEFAULT 0 NOT NULL,
    "pension_employer" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_deductions" numeric(15,2) DEFAULT 0 NOT NULL,
    "net_pay" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" "public"."finance_payroll_status" DEFAULT 'Draft'::"public"."finance_payroll_status" NOT NULL,
    "payment_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."finance_payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_purchase_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "quantity" numeric(15,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "total" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "gl_account_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "finance_purchase_items_quantity_check" CHECK (("quantity" >= (0)::numeric)),
    CONSTRAINT "finance_purchase_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."finance_purchase_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_no" character varying(50) NOT NULL,
    "purchase_type" "public"."finance_purchase_type" NOT NULL,
    "seller_tin" character varying(50),
    "seller_name" character varying(255) NOT NULL,
    "seller_id" "uuid",
    "purchase_date" "date" NOT NULL,
    "receipt_source" "public"."finance_receipt_source" NOT NULL,
    "reference_no" character varying(100),
    "gl_account_id" "uuid" NOT NULL,
    "vat_type" "public"."finance_vat_type" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "vat_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" character varying(50) DEFAULT 'Draft'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."finance_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_no" character varying(50) NOT NULL,
    "sales_type" "public"."finance_sales_type" NOT NULL,
    "sales_category" character varying(50) NOT NULL,
    "cash_received" numeric(15,2) DEFAULT 0,
    "customer_tin" character varying(50),
    "customer_name" character varying(255) NOT NULL,
    "customer_id" "uuid",
    "sales_date" "date" NOT NULL,
    "receipt_source" "public"."finance_receipt_source" NOT NULL,
    "vat_withholding" "public"."finance_vat_withholding" DEFAULT 'No Withholding'::"public"."finance_vat_withholding" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "vat_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "withholding_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "net_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" character varying(50) DEFAULT 'Draft'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."finance_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_sales_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 15.00,
    "total" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "gl_account_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "finance_sales_items_quantity_check" CHECK (("quantity" >= (0)::numeric)),
    CONSTRAINT "finance_sales_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."finance_sales_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_type" character varying(50) NOT NULL,
    "source_id" "uuid" NOT NULL,
    "sync_type" character varying(50) NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "period_start" "date",
    "period_end" "date",
    "status" character varying(20) DEFAULT 'success'::character varying NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."finance_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_tax_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tax_type" character varying(50) NOT NULL,
    "rate" numeric(5,2) NOT NULL,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."finance_tax_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."installations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_order_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "installation_no" "text",
    "site_address" "text",
    "contact_person" "text",
    "contact_phone" "text",
    "items_installed" "text" DEFAULT '[]'::"jsonb",
    "team" "text",
    "team_lead" "text",
    "scheduled_date" "date",
    "scheduled_time" time without time zone,
    "completion_time" timestamp with time zone,
    "status" "text" DEFAULT 'Scheduled'::"text",
    "signed_off_by" "text",
    "logged_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "note" "text",
    CONSTRAINT "installations_status_check" CHECK (("status" = ANY (ARRAY['Scheduled'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."installations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_code" "text",
    "name" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "unit_of_measure" "text",
    "current_quantity" numeric DEFAULT 0,
    "minimum_stock" numeric DEFAULT 0,
    "location" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    CONSTRAINT "inventory_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inventory_id" "uuid" NOT NULL,
    "movement_type" "text" NOT NULL,
    "quantity" numeric NOT NULL,
    "reference_type" "text",
    "reference_id" "uuid",
    "machine_id" "uuid",
    "production_order_id" "uuid",
    "performed_by" "uuid",
    "notes" "text",
    "movement_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventory_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['in'::"text", 'out'::"text"])))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "description" "text",
    "quantity" numeric DEFAULT 1,
    "unit_price" numeric DEFAULT 0,
    "total" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "invoice_no" "text",
    "invoice_type" "text",
    "issue_date" "date",
    "due_date" "date",
    "reference" "text",
    "subtotal" numeric DEFAULT 0,
    "vat_amount" numeric DEFAULT 0,
    "grand_total" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "balance" numeric DEFAULT 0,
    "status" "text" DEFAULT 'Unpaid'::"text",
    "payment_method" "text",
    "bank_name" "text",
    "receipt_issued" boolean DEFAULT false,
    "receipt_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "invoices_invoice_type_check" CHECK (("invoice_type" = ANY (ARRAY['Proforma'::"text", 'Sales Invoice'::"text"]))),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['Unpaid'::"text", 'Paid'::"text", 'Partially Paid'::"text", 'Pending'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "pcs" numeric DEFAULT 0,
    "kilo" numeric DEFAULT 0,
    "care" numeric DEFAULT 0,
    "liter" numeric DEFAULT 0,
    "meter" numeric DEFAULT 0,
    "pack" numeric DEFAULT 0,
    "gram" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "job_no" "text",
    "collaboration" "text",
    "order_status" "text" DEFAULT 'Pending'::"text",
    "start_time" timestamp with time zone,
    "delivery_time" timestamp with time zone,
    "expected_date" "date",
    "follow_up" "text",
    "delivery_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "job_orders_order_status_check" CHECK (("order_status" = ANY (ARRAY['Pending'::"text", 'Started'::"text", 'Completed'::"text"])))
);


ALTER TABLE "public"."job_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."machine_maintenance_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "machine_id" "uuid" NOT NULL,
    "checklist_type" "text" NOT NULL,
    "checklist_name" "text" NOT NULL,
    "description" "text",
    "checklist_items" "jsonb" DEFAULT '[]'::"jsonb",
    "estimated_duration" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "machine_maintenance_checklists_checklist_type_check" CHECK (("checklist_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"])))
);


ALTER TABLE "public"."machine_maintenance_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."machine_maintenance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid" NOT NULL,
    "machine_id" "uuid" NOT NULL,
    "performed_by" "uuid",
    "performed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checklist_results" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "status" "text" DEFAULT 'completed'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "machine_maintenance_logs_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'partial'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."machine_maintenance_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."machine_operator_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "machine_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."machine_operator_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."machines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "machine_type" "text" NOT NULL,
    "model" "text",
    "serial_number" "text",
    "location" "text",
    "status" "text" DEFAULT 'active'::"text",
    "purchased_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "machines_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'maintenance'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."machines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "text" "text",
    "is_read" boolean DEFAULT false,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attached_files" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "client_name" "text" NOT NULL,
    "client_type" "public"."client_type" DEFAULT 'organization'::"public"."client_type" NOT NULL,
    "business_sector" "text",
    "tin_number" "text",
    "address" "text",
    "discovery" "text",
    "level" "public"."client_level" DEFAULT 'standard'::"public"."client_level" NOT NULL,
    "file_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mrk_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_digital_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "log_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "content_no" "text" NOT NULL,
    "content_title" "text" NOT NULL,
    "content_script" "text",
    "social_channel" "text",
    "share_to" "public"."share_target" DEFAULT 'marketing_manager'::"public"."share_target" NOT NULL,
    "file_url" "text",
    "voice_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mrk_digital_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feedback_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "client_name" "text" NOT NULL,
    "project_name" "text",
    "project_no" "text",
    "overall_score" integer,
    "service_score" integer,
    "grade" "text" GENERATED ALWAYS AS (
CASE
    WHEN (GREATEST(COALESCE("overall_score", 0), COALESCE("service_score", 0)) >= 95) THEN 'A'::"text"
    WHEN (GREATEST(COALESCE("overall_score", 0), COALESCE("service_score", 0)) >= 80) THEN 'B'::"text"
    WHEN (GREATEST(COALESCE("overall_score", 0), COALESCE("service_score", 0)) >= 60) THEN 'C'::"text"
    ELSE 'D'::"text"
END) STORED,
    "file_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mrk_feedbacks_overall_score_check" CHECK ((("overall_score" >= 0) AND ("overall_score" <= 100))),
    CONSTRAINT "mrk_feedbacks_service_score_check" CHECK ((("service_score" >= 0) AND ("service_score" <= 100)))
);


ALTER TABLE "public"."mrk_feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "invoice_no" "text" NOT NULL,
    "client_id" "uuid",
    "client_name" "text" NOT NULL,
    "reference_no" "text",
    "item_service" "text",
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "vat_included" boolean DEFAULT true NOT NULL,
    "vat_amount" numeric(14,2) GENERATED ALWAYS AS (
CASE
    WHEN "vat_included" THEN "round"(("subtotal" * 0.15), 2)
    ELSE (0)::numeric
END) STORED,
    "grand_total" numeric(14,2) GENERATED ALWAYS AS (("subtotal" +
CASE
    WHEN "vat_included" THEN "round"(("subtotal" * 0.15), 2)
    ELSE (0)::numeric
END)) STORED,
    "company_tin" "text",
    "payment_term" "text",
    "file_url" "text",
    "voice_note_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mrk_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_market_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_no" "text" NOT NULL,
    "request_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "request_type" "text" NOT NULL,
    "description" "text",
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level" NOT NULL,
    "assigned_to" "uuid",
    "due_date" "date",
    "status" "public"."request_status" DEFAULT 'pending'::"public"."request_status" NOT NULL,
    "file_url" "text",
    "voice_note_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mrk_market_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_research_logins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "research_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "research_no" "text" NOT NULL,
    "title" "text" NOT NULL,
    "reason" "text",
    "objective" "text",
    "methodology" "text",
    "file_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mrk_research_logins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrk_tenders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tender_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "company_name" "text" NOT NULL,
    "tender_no" "text" NOT NULL,
    "item_service" "text",
    "cpo_amount" numeric(14,2),
    "total_price" numeric(14,2),
    "vat_status" "public"."vat_status" DEFAULT 'with_vat'::"public"."vat_status" NOT NULL,
    "file_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mrk_tenders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "title" "text" NOT NULL,
    "type" "public"."activity_type" NOT NULL,
    "status" "public"."activity_status" DEFAULT 'planned'::"public"."activity_status",
    "scheduled_start" timestamp with time zone,
    "scheduled_end" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "assigned_to" "uuid",
    "location" "text",
    "notes" "text",
    "checklists" "jsonb" DEFAULT '[]'::"jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_campaign_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "metric" "text" NOT NULL,
    "target_value" numeric(12,2),
    "actual_value" numeric(12,2) DEFAULT 0,
    "target_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_campaign_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."campaign_status" DEFAULT 'planned'::"public"."campaign_status",
    "start_date" "date",
    "end_date" "date",
    "budget_estimated" numeric(12,2) DEFAULT 0,
    "owner_id" "uuid",
    "notes" "text",
    "plan_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "category" "public"."expense_category" NOT NULL,
    "description" "text",
    "amount" numeric(12,2) NOT NULL,
    "expense_date" "date" NOT NULL,
    "receipt_url" "text",
    "submitted_by" "uuid",
    "approved_by" "uuid",
    "approval_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mrkt_expenses_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "mrkt_expenses_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."mrkt_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_market_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."insight_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "source" "text",
    "date_identified" "date" DEFAULT CURRENT_DATE,
    "relevance_score" integer,
    "campaign_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mrkt_market_insights_relevance_score_check" CHECK ((("relevance_score" >= 1) AND ("relevance_score" <= 10)))
);


ALTER TABLE "public"."mrkt_market_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "parent_plan_id" "uuid",
    "start_date" "date",
    "end_date" "date",
    "target_revenue" numeric(12,2) DEFAULT 0,
    "target_leads" integer DEFAULT 0,
    "owner_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mrkt_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"]))),
    CONSTRAINT "mrkt_plans_type_check" CHECK (("type" = ANY (ARRAY['annual'::"text", 'monthly'::"text", 'weekly'::"text", 'quarterly'::"text"])))
);


ALTER TABLE "public"."mrkt_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_products_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text",
    "category" "text",
    "unit_cost" numeric(12,2) DEFAULT 0,
    "unit_price" numeric(12,2) DEFAULT 0,
    "sku" "text",
    "marketing" "text",
    "strategy" "text",
    "date" "date",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mrkt_products_services_type_check" CHECK (("type" = ANY (ARRAY['product'::"text", 'service'::"text"])))
);


ALTER TABLE "public"."mrkt_products_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_proforma_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proforma_id" "uuid",
    "product_service_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_proforma_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_proformas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "amount" numeric(12,2) DEFAULT 0,
    "status" "public"."proforma_status" DEFAULT 'requested'::"public"."proforma_status",
    "requested_at" timestamp with time zone,
    "submitted_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "owner_id" "uuid",
    "file_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_proformas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_proposal_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid",
    "product_service_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_proposal_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "amount" numeric(12,2) DEFAULT 0,
    "status" "public"."proposal_status" DEFAULT 'draft'::"public"."proposal_status",
    "submitted_at" timestamp with time zone,
    "follow_up_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "owner_id" "uuid",
    "file_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mrkt_tenders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "title" "text" NOT NULL,
    "client_name" "text",
    "amount" numeric(12,2) DEFAULT 0,
    "status" "public"."tender_status" DEFAULT 'opportunity'::"public"."tender_status",
    "deadline" "date",
    "submitted_at" timestamp with time zone,
    "awarded_at" timestamp with time zone,
    "owner_id" "uuid",
    "file_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mrkt_tenders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "title" "text",
    "content" "text",
    "color" "text",
    "pinned" boolean DEFAULT false,
    "checklist" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "department_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text",
    "icon" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text",
    "category" "text" DEFAULT 'general'::"text",
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "quantity" numeric DEFAULT 1,
    "description" "text",
    "unit" "text",
    "unit_price" numeric DEFAULT 0,
    "discount_percent" numeric DEFAULT 0,
    "tax_percent" numeric DEFAULT 0,
    "amount" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "order_no" "text",
    "order_date" "date",
    "required_date" "date",
    "status" "text" DEFAULT 'New'::"text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "total_amount" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "balance" numeric DEFAULT 0,
    "reference_po" "text",
    "sales_officer_id" "uuid",
    "department_id" "uuid",
    "currency" "text" DEFAULT 'ETB'::"text",
    "payment_terms" "text",
    "special_instructions" "text",
    "attachments" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sales_type" "text" DEFAULT 'direct_sales'::"text",
    CONSTRAINT "orders_priority_check" CHECK (("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text"]))),
    CONSTRAINT "orders_sales_type_check" CHECK (("sales_type" = ANY (ARRAY['from_design'::"text", 'direct_sales'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'In Progress'::"text", 'In Production'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "payment_date" "date",
    "amount_paid" numeric DEFAULT 0,
    "gross_amount" numeric DEFAULT 0,
    "unpaid_amount" numeric DEFAULT 0,
    "payment_method" "text",
    "bank_wallet" "text",
    "reference_number" "text",
    "received_by" "text",
    "invoice_status" "text",
    "processing_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "payments_invoice_status_check" CHECK (("invoice_status" = ANY (ARRAY['Unpaid'::"text", 'Paid'::"text", 'Partially Paid'::"text"]))),
    CONSTRAINT "payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['Cash'::"text", 'Bank Transfer'::"text", 'Mobile Money'::"text", 'Card'::"text", 'Credit'::"text", 'E-commerce'::"text"]))),
    CONSTRAINT "payments_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['Requires Payment Method'::"text", 'Requires Action'::"text", 'Processing'::"text", 'Requires Capture'::"text", 'Succeeded'::"text", 'Failed'::"text", 'Canceled'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid",
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "designer_id" "uuid",
    "machine_id" "uuid",
    "material" "text",
    "thickness" "text",
    "color" "text",
    "length" "text",
    "width" "text",
    "height" "text",
    "gram" "text",
    "quality_status" "text",
    "completed_at" timestamp with time zone,
    "area" numeric,
    "task_type" "text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "status" "text" DEFAULT 'New'::"text",
    "job_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "rework_reason" "text",
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "note" "text",
    "job_order_id" "uuid",
    CONSTRAINT "production_orders_job_type_check" CHECK (("job_type" = ANY (ARRAY['received'::"text", 'rework'::"text"]))),
    CONSTRAINT "production_orders_priority_check" CHECK (("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text"]))),
    CONSTRAINT "production_orders_quality_status_check" CHECK (("quality_status" = ANY (ARRAY['Pass'::"text", 'Fail'::"text", 'Pending'::"text"]))),
    CONSTRAINT "production_orders_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"]))),
    CONSTRAINT "production_orders_task_type_check" CHECK (("task_type" = ANY (ARRAY['project'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."production_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token" "text" NOT NULL,
    "platform" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."read_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone
);


ALTER TABLE "public"."read_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_captions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "department" "text" NOT NULL,
    "from_date" "date" NOT NULL,
    "to_date" "date" NOT NULL,
    "note" "text",
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "report_captions_check" CHECK (("to_date" >= "from_date")),
    CONSTRAINT "report_captions_department_check" CHECK (("department" = ANY (ARRAY['frontdesk'::"text", 'design'::"text", 'production'::"text", 'marketing'::"text", 'creative'::"text", 'finance'::"text"])))
);


ALTER TABLE "public"."report_captions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "request_no" "text",
    "visit_purpose" "text",
    "city" "text",
    "detailed_address" "text",
    "requested_date" "date",
    "preferred_date" "date",
    "preferred_time" time without time zone,
    "requested_by" "text",
    "installation_team" "text",
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "equipment_review" "text",
    "special_instructions" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "department_id" "uuid",
    CONSTRAINT "site_visits_priority_check" CHECK (("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text"]))),
    CONSTRAINT "site_visits_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Scheduled'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."site_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_proforma_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_no" "text" NOT NULL,
    "order_no" "text",
    "client_name" "text" NOT NULL,
    "subtotal" numeric DEFAULT 0,
    "vat_amount" numeric DEFAULT 0,
    "vat_percentage" numeric DEFAULT 15,
    "grand_total" numeric DEFAULT 0,
    "apply_vat" boolean DEFAULT true,
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'not_upgraded'::"text",
    "attached_file_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    CONSTRAINT "test_proforma_invoices_status_check" CHECK (("status" = ANY (ARRAY['not_upgraded'::"text", 'upgraded'::"text"])))
);


ALTER TABLE "public"."test_proforma_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "department_id" "uuid",
    "username" "text" NOT NULL,
    "password_hash" "text",
    "email" "text",
    "phone" "text",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'designer'::"text", 'front_desk'::"text", 'machine_operator'::"text", 'admin_machine_operator'::"text", 'finish'::"text", 'marketer'::"text", 'admin_marketer'::"text", 'finance'::"text", 'creative'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warranties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "order_item_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "product_name" "text",
    "serial_no" "text",
    "purchase_date" "date",
    "warranty_expiry" "date",
    "defect_description" "text",
    "attachments" "uuid"[] DEFAULT '{}'::"uuid"[],
    "claim_type" "text",
    "assigned_to" "text",
    "resolution" "text",
    "status" "text" DEFAULT 'New'::"text",
    "filed_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "warranties_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'In Progress'::"text", 'Approved'::"text", 'Rejected'::"text", 'Closed'::"text"])))
);


ALTER TABLE "public"."warranties" OWNER TO "postgres";


ALTER TABLE ONLY "finance"."finance_sync_log"
    ADD CONSTRAINT "finance_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."gl_accounts"
    ADD CONSTRAINT "gl_accounts_account_code_key" UNIQUE ("account_code");



ALTER TABLE ONLY "finance"."gl_accounts"
    ADD CONSTRAINT "gl_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."journal_lines"
    ADD CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."journals"
    ADD CONSTRAINT "journals_journal_no_key" UNIQUE ("journal_no");



ALTER TABLE ONLY "finance"."journals"
    ADD CONSTRAINT "journals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."purchase_items"
    ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."purchases"
    ADD CONSTRAINT "purchases_purchase_no_key" UNIQUE ("purchase_no");



ALTER TABLE ONLY "finance"."sales_items"
    ADD CONSTRAINT "sales_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."sales"
    ADD CONSTRAINT "sales_sales_no_key" UNIQUE ("sales_no");



ALTER TABLE ONLY "finance"."tax_rates"
    ADD CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_attachment_chunks"
    ADD CONSTRAINT "ai_attachment_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_attachments"
    ADD CONSTRAINT "ai_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crt_design_bom"
    ADD CONSTRAINT "crt_design_bom_design_reference_key" UNIQUE ("design_reference");



ALTER TABLE ONLY "public"."crt_design_bom"
    ADD CONSTRAINT "crt_design_bom_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crt_idea_hub"
    ADD CONSTRAINT "crt_idea_hub_idea_code_key" UNIQUE ("idea_code");



ALTER TABLE ONLY "public"."crt_idea_hub"
    ADD CONSTRAINT "crt_idea_hub_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crt_prototype_requests"
    ADD CONSTRAINT "crt_prototype_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crt_prototype_requests"
    ADD CONSTRAINT "crt_prototype_requests_request_number_key" UNIQUE ("request_number");



ALTER TABLE ONLY "public"."crt_staff_leaves"
    ADD CONSTRAINT "crt_staff_leaves_leave_id_key" UNIQUE ("leave_id");



ALTER TABLE ONLY "public"."crt_staff_leaves"
    ADD CONSTRAINT "crt_staff_leaves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."design_communications"
    ADD CONSTRAINT "design_communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."design_versions"
    ADD CONSTRAINT "design_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "designs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_gl_accounts"
    ADD CONSTRAINT "finance_gl_accounts_account_code_key" UNIQUE ("account_code");



ALTER TABLE ONLY "public"."finance_gl_accounts"
    ADD CONSTRAINT "finance_gl_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_journal_lines"
    ADD CONSTRAINT "finance_journal_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_journals"
    ADD CONSTRAINT "finance_journals_journal_no_key" UNIQUE ("journal_no");



ALTER TABLE ONLY "public"."finance_journals"
    ADD CONSTRAINT "finance_journals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_payroll"
    ADD CONSTRAINT "finance_payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_purchase_items"
    ADD CONSTRAINT "finance_purchase_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_purchases"
    ADD CONSTRAINT "finance_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_purchases"
    ADD CONSTRAINT "finance_purchases_purchase_no_key" UNIQUE ("purchase_no");



ALTER TABLE ONLY "public"."finance_sales_items"
    ADD CONSTRAINT "finance_sales_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_sales"
    ADD CONSTRAINT "finance_sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_sales"
    ADD CONSTRAINT "finance_sales_sales_no_key" UNIQUE ("sales_no");



ALTER TABLE ONLY "public"."finance_sync_log"
    ADD CONSTRAINT "finance_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_tax_rates"
    ADD CONSTRAINT "finance_tax_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_item_code_key" UNIQUE ("item_code");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_orders"
    ADD CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."machine_maintenance_checklists"
    ADD CONSTRAINT "machine_maintenance_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."machine_maintenance_logs"
    ADD CONSTRAINT "machine_maintenance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."machine_operator_users"
    ADD CONSTRAINT "machine_operator_users_machine_user_unique" UNIQUE ("machine_id", "user_id");



ALTER TABLE ONLY "public"."machine_operator_users"
    ADD CONSTRAINT "machine_operator_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."machines"
    ADD CONSTRAINT "machines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_clients"
    ADD CONSTRAINT "mrk_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_digital_logs"
    ADD CONSTRAINT "mrk_digital_logs_content_no_key" UNIQUE ("content_no");



ALTER TABLE ONLY "public"."mrk_digital_logs"
    ADD CONSTRAINT "mrk_digital_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_feedbacks"
    ADD CONSTRAINT "mrk_feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_invoices"
    ADD CONSTRAINT "mrk_invoices_invoice_no_key" UNIQUE ("invoice_no");



ALTER TABLE ONLY "public"."mrk_invoices"
    ADD CONSTRAINT "mrk_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_market_requests"
    ADD CONSTRAINT "mrk_market_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_market_requests"
    ADD CONSTRAINT "mrk_market_requests_request_no_key" UNIQUE ("request_no");



ALTER TABLE ONLY "public"."mrk_research_logins"
    ADD CONSTRAINT "mrk_research_logins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_research_logins"
    ADD CONSTRAINT "mrk_research_logins_research_no_key" UNIQUE ("research_no");



ALTER TABLE ONLY "public"."mrk_tenders"
    ADD CONSTRAINT "mrk_tenders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrk_tenders"
    ADD CONSTRAINT "mrk_tenders_tender_no_key" UNIQUE ("tender_no");



ALTER TABLE ONLY "public"."mrkt_activities"
    ADD CONSTRAINT "mrkt_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_campaign_targets"
    ADD CONSTRAINT "mrkt_campaign_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_campaigns"
    ADD CONSTRAINT "mrkt_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_expenses"
    ADD CONSTRAINT "mrkt_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_market_insights"
    ADD CONSTRAINT "mrkt_market_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_plans"
    ADD CONSTRAINT "mrkt_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_products_services"
    ADD CONSTRAINT "mrkt_products_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_products_services"
    ADD CONSTRAINT "mrkt_products_services_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."mrkt_proforma_items"
    ADD CONSTRAINT "mrkt_proforma_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_proformas"
    ADD CONSTRAINT "mrkt_proformas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_proposal_items"
    ADD CONSTRAINT "mrkt_proposal_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_proposals"
    ADD CONSTRAINT "mrkt_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mrkt_tenders"
    ADD CONSTRAINT "mrkt_tenders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_communications"
    ADD CONSTRAINT "production_communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_devices"
    ADD CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_devices"
    ADD CONSTRAINT "push_devices_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."read_notifications"
    ADD CONSTRAINT "read_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_captions"
    ADD CONSTRAINT "report_captions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_visits"
    ADD CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_proforma_invoices"
    ADD CONSTRAINT "test_proforma_invoices_invoice_no_key" UNIQUE ("invoice_no");



ALTER TABLE ONLY "public"."test_proforma_invoices"
    ADD CONSTRAINT "test_proforma_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warranties"
    ADD CONSTRAINT "warranties_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_gl_accounts_parent" ON "finance"."gl_accounts" USING "btree" ("parent_id");



CREATE INDEX "idx_gl_accounts_type" ON "finance"."gl_accounts" USING "btree" ("account_type");



CREATE INDEX "idx_journal_lines_account" ON "finance"."journal_lines" USING "btree" ("gl_account_id");



CREATE INDEX "idx_journal_lines_journal" ON "finance"."journal_lines" USING "btree" ("journal_id");



CREATE INDEX "idx_journals_date" ON "finance"."journals" USING "btree" ("journal_date");



CREATE INDEX "idx_journals_status" ON "finance"."journals" USING "btree" ("status");



CREATE INDEX "idx_payroll_employee" ON "finance"."payroll" USING "btree" ("employee_id");



CREATE INDEX "idx_payroll_period" ON "finance"."payroll" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_payroll_status" ON "finance"."payroll" USING "btree" ("status");



CREATE INDEX "idx_purchase_items_item" ON "finance"."purchase_items" USING "btree" ("item_id");



CREATE INDEX "idx_purchase_items_purchase" ON "finance"."purchase_items" USING "btree" ("purchase_id");



CREATE INDEX "idx_purchases_date" ON "finance"."purchases" USING "btree" ("purchase_date");



CREATE INDEX "idx_purchases_seller" ON "finance"."purchases" USING "btree" ("seller_id");



CREATE INDEX "idx_purchases_status" ON "finance"."purchases" USING "btree" ("status");



CREATE INDEX "idx_sales_customer" ON "finance"."sales" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_date" ON "finance"."sales" USING "btree" ("sales_date");



CREATE INDEX "idx_sales_items_item" ON "finance"."sales_items" USING "btree" ("item_id");



CREATE INDEX "idx_sales_items_sales" ON "finance"."sales_items" USING "btree" ("sales_id");



CREATE INDEX "idx_sales_status" ON "finance"."sales" USING "btree" ("status");



CREATE INDEX "idx_sync_log_period" ON "finance"."finance_sync_log" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_sync_log_source" ON "finance"."finance_sync_log" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_sync_log_status" ON "finance"."finance_sync_log" USING "btree" ("status");



CREATE INDEX "idx_sync_log_type" ON "finance"."finance_sync_log" USING "btree" ("sync_type");



CREATE UNIQUE INDEX "idx_sync_log_unique" ON "finance"."finance_sync_log" USING "btree" ("source_type", "source_id", "sync_type", "period_start", "period_end") WHERE (("status")::"text" = 'success'::"text");



CREATE INDEX "idx_ai_attachment_chunks_attachment" ON "public"."ai_attachment_chunks" USING "btree" ("attachment_id", "chunk_index");



CREATE INDEX "idx_ai_attachments_session" ON "public"."ai_attachments" USING "btree" ("session_id", "created_at");



CREATE INDEX "idx_ai_chats_session" ON "public"."ai_chats" USING "btree" ("session_id", "created_at");



CREATE INDEX "idx_client_contacts_client_id" ON "public"."client_contacts" USING "btree" ("client_id");



CREATE INDEX "idx_clients_assigned_sales_officer_id" ON "public"."clients" USING "btree" ("assigned_sales_officer_id");



CREATE INDEX "idx_clients_client_type" ON "public"."clients" USING "btree" ("client_type");



CREATE INDEX "idx_clients_status" ON "public"."clients" USING "btree" ("status");



CREATE INDEX "idx_complaints_client_id" ON "public"."complaints" USING "btree" ("client_id");



CREATE INDEX "idx_complaints_order_id" ON "public"."complaints" USING "btree" ("order_id");



CREATE INDEX "idx_deliveries_client_id" ON "public"."deliveries" USING "btree" ("client_id");



CREATE INDEX "idx_deliveries_job_order_id" ON "public"."deliveries" USING "btree" ("job_order_id");



CREATE INDEX "idx_design_communications_created_at" ON "public"."design_communications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_design_communications_design_id" ON "public"."design_communications" USING "btree" ("design_id");



CREATE INDEX "idx_design_communications_sender_id" ON "public"."design_communications" USING "btree" ("sender_id");



CREATE INDEX "idx_design_versions_design_id" ON "public"."design_versions" USING "btree" ("design_id");



CREATE INDEX "idx_designs_assigned_designer_id" ON "public"."designs" USING "btree" ("assigned_designer_id");



CREATE INDEX "idx_designs_order_id" ON "public"."designs" USING "btree" ("order_id");



CREATE INDEX "idx_feedbacks_client_id" ON "public"."feedbacks" USING "btree" ("client_id");



CREATE INDEX "idx_feedbacks_order_id" ON "public"."feedbacks" USING "btree" ("order_id");



CREATE INDEX "idx_finance_gl_accounts_parent" ON "public"."finance_gl_accounts" USING "btree" ("parent_id");



CREATE INDEX "idx_finance_gl_accounts_type" ON "public"."finance_gl_accounts" USING "btree" ("account_type");



CREATE INDEX "idx_finance_journal_lines_account" ON "public"."finance_journal_lines" USING "btree" ("gl_account_id");



CREATE INDEX "idx_finance_journal_lines_journal" ON "public"."finance_journal_lines" USING "btree" ("journal_id");



CREATE INDEX "idx_finance_journals_date" ON "public"."finance_journals" USING "btree" ("journal_date");



CREATE INDEX "idx_finance_journals_status" ON "public"."finance_journals" USING "btree" ("status");



CREATE INDEX "idx_finance_payroll_employee" ON "public"."finance_payroll" USING "btree" ("employee_id");



CREATE INDEX "idx_finance_payroll_period" ON "public"."finance_payroll" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_finance_payroll_status" ON "public"."finance_payroll" USING "btree" ("status");



CREATE INDEX "idx_finance_purchase_items_item" ON "public"."finance_purchase_items" USING "btree" ("item_id");



CREATE INDEX "idx_finance_purchase_items_purchase" ON "public"."finance_purchase_items" USING "btree" ("purchase_id");



CREATE INDEX "idx_finance_purchases_date" ON "public"."finance_purchases" USING "btree" ("purchase_date");



CREATE INDEX "idx_finance_purchases_seller" ON "public"."finance_purchases" USING "btree" ("seller_id");



CREATE INDEX "idx_finance_purchases_status" ON "public"."finance_purchases" USING "btree" ("status");



CREATE INDEX "idx_finance_sales_customer" ON "public"."finance_sales" USING "btree" ("customer_id");



CREATE INDEX "idx_finance_sales_date" ON "public"."finance_sales" USING "btree" ("sales_date");



CREATE INDEX "idx_finance_sales_items_item" ON "public"."finance_sales_items" USING "btree" ("item_id");



CREATE INDEX "idx_finance_sales_items_sales" ON "public"."finance_sales_items" USING "btree" ("sales_id");



CREATE INDEX "idx_finance_sales_status" ON "public"."finance_sales" USING "btree" ("status");



CREATE INDEX "idx_finance_sync_log_period" ON "public"."finance_sync_log" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_finance_sync_log_source" ON "public"."finance_sync_log" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_finance_sync_log_status" ON "public"."finance_sync_log" USING "btree" ("status");



CREATE INDEX "idx_finance_sync_log_type" ON "public"."finance_sync_log" USING "btree" ("sync_type");



CREATE UNIQUE INDEX "idx_finance_sync_log_unique" ON "public"."finance_sync_log" USING "btree" ("source_type", "source_id", "sync_type", "period_start", "period_end") WHERE (("status")::"text" = 'success'::"text");



CREATE INDEX "idx_installations_client_id" ON "public"."installations" USING "btree" ("client_id");



CREATE INDEX "idx_installations_job_order_id" ON "public"."installations" USING "btree" ("job_order_id");



CREATE INDEX "idx_inventory_item_code" ON "public"."inventory" USING "btree" ("item_code");



CREATE INDEX "idx_inventory_movements_inventory_id" ON "public"."inventory_movements" USING "btree" ("inventory_id");



CREATE INDEX "idx_inventory_movements_machine_id" ON "public"."inventory_movements" USING "btree" ("machine_id");



CREATE INDEX "idx_inventory_movements_movement_date" ON "public"."inventory_movements" USING "btree" ("movement_date" DESC);



CREATE INDEX "idx_inventory_movements_movement_type" ON "public"."inventory_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_inventory_movements_production_order_id" ON "public"."inventory_movements" USING "btree" ("production_order_id");



CREATE INDEX "idx_inventory_status" ON "public"."inventory" USING "btree" ("status");



CREATE INDEX "idx_inventory_user_id" ON "public"."inventory" USING "btree" ("user_id");



CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoices_order_id" ON "public"."invoices" USING "btree" ("order_id");



CREATE INDEX "idx_job_orders_invoice_id" ON "public"."job_orders" USING "btree" ("invoice_id");



CREATE INDEX "idx_machine_maintenance_checklists_machine_id" ON "public"."machine_maintenance_checklists" USING "btree" ("machine_id");



CREATE INDEX "idx_machine_maintenance_checklists_type" ON "public"."machine_maintenance_checklists" USING "btree" ("checklist_type");



CREATE INDEX "idx_machine_maintenance_logs_checklist_id" ON "public"."machine_maintenance_logs" USING "btree" ("checklist_id");



CREATE INDEX "idx_machine_maintenance_logs_machine_id" ON "public"."machine_maintenance_logs" USING "btree" ("machine_id");



CREATE INDEX "idx_machine_maintenance_logs_performed_at" ON "public"."machine_maintenance_logs" USING "btree" ("performed_at" DESC);



CREATE INDEX "idx_machine_maintenance_logs_performed_by" ON "public"."machine_maintenance_logs" USING "btree" ("performed_by");



CREATE INDEX "idx_machine_operator_users_machine_id" ON "public"."machine_operator_users" USING "btree" ("machine_id");



CREATE INDEX "idx_machine_operator_users_user_id" ON "public"."machine_operator_users" USING "btree" ("user_id");



CREATE INDEX "idx_machines_machine_type" ON "public"."machines" USING "btree" ("machine_type");



CREATE INDEX "idx_machines_status" ON "public"."machines" USING "btree" ("status");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("sender_id", "receiver_id", "created_at");



CREATE INDEX "idx_messages_receiver_id" ON "public"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_receiver_unread" ON "public"."messages" USING "btree" ("receiver_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_mrk_clients_created_by" ON "public"."mrk_clients" USING "btree" ("created_by");



CREATE INDEX "idx_mrk_invoices_client_id" ON "public"."mrk_invoices" USING "btree" ("client_id");



CREATE INDEX "idx_mrk_invoices_created_by" ON "public"."mrk_invoices" USING "btree" ("created_by");



CREATE INDEX "idx_mrk_market_requests_created_by" ON "public"."mrk_market_requests" USING "btree" ("created_by");



CREATE INDEX "idx_mrk_market_requests_status" ON "public"."mrk_market_requests" USING "btree" ("status");



CREATE INDEX "idx_mrkt_activities_assigned" ON "public"."mrkt_activities" USING "btree" ("assigned_to");



CREATE INDEX "idx_mrkt_activities_campaign" ON "public"."mrkt_activities" USING "btree" ("campaign_id");



CREATE INDEX "idx_mrkt_activities_status" ON "public"."mrkt_activities" USING "btree" ("status");



CREATE INDEX "idx_mrkt_campaigns_owner" ON "public"."mrkt_campaigns" USING "btree" ("owner_id");



CREATE INDEX "idx_mrkt_campaigns_plan" ON "public"."mrkt_campaigns" USING "btree" ("plan_id");



CREATE INDEX "idx_mrkt_campaigns_status" ON "public"."mrkt_campaigns" USING "btree" ("status");



CREATE INDEX "idx_mrkt_expenses_campaign" ON "public"."mrkt_expenses" USING "btree" ("campaign_id");



CREATE INDEX "idx_mrkt_expenses_date" ON "public"."mrkt_expenses" USING "btree" ("expense_date");



CREATE INDEX "idx_mrkt_market_insights_type" ON "public"."mrkt_market_insights" USING "btree" ("type");



CREATE INDEX "idx_mrkt_plans_dates" ON "public"."mrkt_plans" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_mrkt_plans_parent" ON "public"."mrkt_plans" USING "btree" ("parent_plan_id");



CREATE INDEX "idx_mrkt_plans_type" ON "public"."mrkt_plans" USING "btree" ("type");



CREATE INDEX "idx_mrkt_proformas_campaign" ON "public"."mrkt_proformas" USING "btree" ("campaign_id");



CREATE INDEX "idx_mrkt_proposals_campaign" ON "public"."mrkt_proposals" USING "btree" ("campaign_id");



CREATE INDEX "idx_mrkt_proposals_status" ON "public"."mrkt_proposals" USING "btree" ("status");



CREATE INDEX "idx_mrkt_tenders_campaign" ON "public"."mrkt_tenders" USING "btree" ("campaign_id");



CREATE INDEX "idx_notes_entity_type_entity_id" ON "public"."notes" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_notes_user_id" ON "public"."notes" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_category" ON "public"."notifications" USING "btree" ("category");



CREATE INDEX "idx_notifications_department_id" ON "public"."notifications" USING "btree" ("department_id");



CREATE INDEX "idx_notifications_department_null" ON "public"."notifications" USING "btree" ("department_id") WHERE ("department_id" IS NULL);



CREATE INDEX "idx_notifications_entity_type_entity_id" ON "public"."notifications" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_notifications_marketing_category" ON "public"."notifications" USING "btree" ("category");



CREATE INDEX "idx_notifications_marketing_department_null" ON "public"."notifications" USING "btree" ("department_id") WHERE ("department_id" IS NULL);



CREATE INDEX "idx_notifications_marketing_entity_type_entity_id" ON "public"."notifications" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_notifications_marketing_priority" ON "public"."notifications" USING "btree" ("priority");



CREATE INDEX "idx_notifications_priority" ON "public"."notifications" USING "btree" ("priority");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_client_id" ON "public"."orders" USING "btree" ("client_id");



CREATE INDEX "idx_orders_sales_officer_id" ON "public"."orders" USING "btree" ("sales_officer_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_payments_client_id" ON "public"."payments" USING "btree" ("client_id");



CREATE INDEX "idx_payments_invoice_id" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_production_communications_created_at" ON "public"."production_communications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_production_communications_order_id" ON "public"."production_communications" USING "btree" ("production_order_id");



CREATE INDEX "idx_production_communications_receiver_id" ON "public"."production_communications" USING "btree" ("receiver_id");



CREATE INDEX "idx_production_communications_sender_id" ON "public"."production_communications" USING "btree" ("sender_id");



CREATE INDEX "idx_production_orders_designer_id" ON "public"."production_orders" USING "btree" ("designer_id");



CREATE INDEX "idx_production_orders_job_order_id" ON "public"."production_orders" USING "btree" ("job_order_id");



CREATE INDEX "idx_production_orders_job_type" ON "public"."production_orders" USING "btree" ("job_type");



CREATE INDEX "idx_production_orders_machine_id" ON "public"."production_orders" USING "btree" ("machine_id");



CREATE INDEX "idx_production_orders_order_id" ON "public"."production_orders" USING "btree" ("order_id");



CREATE INDEX "idx_production_orders_priority" ON "public"."production_orders" USING "btree" ("priority");



CREATE INDEX "idx_production_orders_status" ON "public"."production_orders" USING "btree" ("status");



CREATE INDEX "idx_read_notifications_notification_id" ON "public"."read_notifications" USING "btree" ("notification_id");



CREATE INDEX "idx_read_notifications_user_id" ON "public"."read_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_report_captions_created_at" ON "public"."report_captions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_report_captions_dates" ON "public"."report_captions" USING "btree" ("from_date", "to_date");



CREATE INDEX "idx_report_captions_department" ON "public"."report_captions" USING "btree" ("department");



CREATE INDEX "idx_report_captions_user_id" ON "public"."report_captions" USING "btree" ("user_id");



CREATE INDEX "idx_site_visits_client_id" ON "public"."site_visits" USING "btree" ("client_id");



CREATE INDEX "idx_site_visits_status" ON "public"."site_visits" USING "btree" ("status");



CREATE INDEX "idx_test_proforma_invoices_client_name" ON "public"."test_proforma_invoices" USING "btree" ("client_name");



CREATE INDEX "idx_test_proforma_invoices_invoice_no" ON "public"."test_proforma_invoices" USING "btree" ("invoice_no");



CREATE INDEX "idx_test_proforma_invoices_status" ON "public"."test_proforma_invoices" USING "btree" ("status");



CREATE INDEX "idx_users_department_id" ON "public"."users" USING "btree" ("department_id");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_warranties_client_id" ON "public"."warranties" USING "btree" ("client_id");



CREATE INDEX "idx_warranties_order_id" ON "public"."warranties" USING "btree" ("order_id");



CREATE INDEX "push_devices_user_id_idx" ON "public"."push_devices" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_gl_accounts_updated_at" BEFORE UPDATE ON "finance"."gl_accounts" FOR EACH ROW EXECUTE FUNCTION "finance"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_journals_updated_at" BEFORE UPDATE ON "finance"."journals" FOR EACH ROW EXECUTE FUNCTION "finance"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payroll_updated_at" BEFORE UPDATE ON "finance"."payroll" FOR EACH ROW EXECUTE FUNCTION "finance"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchases_updated_at" BEFORE UPDATE ON "finance"."purchases" FOR EACH ROW EXECUTE FUNCTION "finance"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sales_updated_at" BEFORE UPDATE ON "finance"."sales" FOR EACH ROW EXECUTE FUNCTION "finance"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "notify_order" AFTER INSERT OR DELETE OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://vector-erp-push-notification-backen.vercel.app/change', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "push_devices_touch_updated_at" BEFORE UPDATE ON "public"."push_devices" FOR EACH ROW EXECUTE FUNCTION "public"."touch_push_devices_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_clients_updated_at" BEFORE UPDATE ON "public"."mrk_clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_digital_logs_updated_at" BEFORE UPDATE ON "public"."mrk_digital_logs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_feedbacks_updated_at" BEFORE UPDATE ON "public"."mrk_feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_invoices_updated_at" BEFORE UPDATE ON "public"."mrk_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_market_requests_approval" BEFORE UPDATE ON "public"."mrk_market_requests" FOR EACH ROW EXECUTE FUNCTION "public"."stamp_market_request_approval"();



CREATE OR REPLACE TRIGGER "trg_mrk_market_requests_updated_at" BEFORE UPDATE ON "public"."mrk_market_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_research_logins_updated_at" BEFORE UPDATE ON "public"."mrk_research_logins" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_mrk_tenders_updated_at" BEFORE UPDATE ON "public"."mrk_tenders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_design_status_notification" AFTER UPDATE ON "public"."designs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_design_status_change"();



CREATE OR REPLACE TRIGGER "trigger_design_version_approved_notification" AFTER INSERT OR UPDATE ON "public"."design_versions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_design_version_approved"();



CREATE OR REPLACE TRIGGER "trigger_design_version_sent_notification" AFTER INSERT OR UPDATE ON "public"."design_versions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_design_version_sent"();



CREATE OR REPLACE TRIGGER "trigger_market_request_status_notification" AFTER UPDATE ON "public"."mrk_market_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_market_request_status_change"();



CREATE OR REPLACE TRIGGER "trigger_new_client_notification" AFTER INSERT ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_client"();



CREATE OR REPLACE TRIGGER "trigger_new_complaint_notification" AFTER INSERT ON "public"."complaints" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_complaint"();



CREATE OR REPLACE TRIGGER "trigger_new_design_notification" AFTER INSERT ON "public"."designs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_design"();



CREATE OR REPLACE TRIGGER "trigger_new_digital_content_notification" AFTER INSERT ON "public"."mrk_digital_logs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_digital_content"();



CREATE OR REPLACE TRIGGER "trigger_new_feedback_notification" AFTER INSERT ON "public"."mrk_feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_feedback"();



CREATE OR REPLACE TRIGGER "trigger_new_invoice_notification" AFTER INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_invoice"();



CREATE OR REPLACE TRIGGER "trigger_new_market_request_notification" AFTER INSERT ON "public"."mrk_market_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_market_request"();



CREATE OR REPLACE TRIGGER "trigger_new_marketing_client_notification" AFTER INSERT ON "public"."mrk_clients" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_marketing_client"();



CREATE OR REPLACE TRIGGER "trigger_new_marketing_invoice_notification" AFTER INSERT ON "public"."mrk_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_marketing_invoice"();



CREATE OR REPLACE TRIGGER "trigger_new_order_notification" AFTER INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_order"();



CREATE OR REPLACE TRIGGER "trigger_new_production_order_notification" AFTER INSERT ON "public"."production_orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_production_order"();



CREATE OR REPLACE TRIGGER "trigger_new_research_login_notification" AFTER INSERT ON "public"."mrk_research_logins" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_research_login"();



CREATE OR REPLACE TRIGGER "trigger_new_rework_notification" AFTER INSERT ON "public"."production_orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_rework"();



CREATE OR REPLACE TRIGGER "trigger_new_tender_notification" AFTER INSERT ON "public"."mrk_tenders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_tender"();



CREATE OR REPLACE TRIGGER "trigger_order_status_notification" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_order_status_change"();



CREATE OR REPLACE TRIGGER "trigger_payment_notification" AFTER INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_payment_received"();



CREATE OR REPLACE TRIGGER "trigger_production_order_status_notification" AFTER UPDATE ON "public"."production_orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_production_order_status_change"();



CREATE OR REPLACE TRIGGER "update_crt_design_bom_updated_at" BEFORE UPDATE ON "public"."crt_design_bom" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crt_idea_hub_updated_at" BEFORE UPDATE ON "public"."crt_idea_hub" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crt_prototype_requests_updated_at" BEFORE UPDATE ON "public"."crt_prototype_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crt_staff_leaves_updated_at" BEFORE UPDATE ON "public"."crt_staff_leaves" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_finance_gl_accounts_updated_at" BEFORE UPDATE ON "public"."finance_gl_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."finance_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_finance_journals_updated_at" BEFORE UPDATE ON "public"."finance_journals" FOR EACH ROW EXECUTE FUNCTION "public"."finance_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_finance_payroll_updated_at" BEFORE UPDATE ON "public"."finance_payroll" FOR EACH ROW EXECUTE FUNCTION "public"."finance_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_finance_purchases_updated_at" BEFORE UPDATE ON "public"."finance_purchases" FOR EACH ROW EXECUTE FUNCTION "public"."finance_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_finance_sales_updated_at" BEFORE UPDATE ON "public"."finance_sales" FOR EACH ROW EXECUTE FUNCTION "public"."finance_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_machine_operator_users_updated_at" BEFORE UPDATE ON "public"."machine_operator_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_report_captions_updated_at" BEFORE UPDATE ON "public"."report_captions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "finance"."gl_accounts"
    ADD CONSTRAINT "gl_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "finance"."gl_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "finance"."journal_lines"
    ADD CONSTRAINT "journal_lines_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "finance"."gl_accounts"("id");



ALTER TABLE ONLY "finance"."journal_lines"
    ADD CONSTRAINT "journal_lines_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "finance"."journals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."purchase_items"
    ADD CONSTRAINT "purchase_items_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "finance"."gl_accounts"("id");



ALTER TABLE ONLY "finance"."purchase_items"
    ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "finance"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."purchases"
    ADD CONSTRAINT "purchases_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "finance"."gl_accounts"("id");



ALTER TABLE ONLY "finance"."sales_items"
    ADD CONSTRAINT "sales_items_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "finance"."gl_accounts"("id");



ALTER TABLE ONLY "finance"."sales_items"
    ADD CONSTRAINT "sales_items_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "finance"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_attachment_chunks"
    ADD CONSTRAINT "ai_attachment_chunks_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."ai_attachments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_attachments"
    ADD CONSTRAINT "ai_attachments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_assigned_sales_officer_id_fkey" FOREIGN KEY ("assigned_sales_officer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."design_communications"
    ADD CONSTRAINT "design_communications_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."design_communications"
    ADD CONSTRAINT "design_communications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."design_communications"
    ADD CONSTRAINT "design_communications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."design_versions"
    ADD CONSTRAINT "design_versions_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."design_versions"
    ADD CONSTRAINT "design_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "designs_assigned_designer_id_fkey" FOREIGN KEY ("assigned_designer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "designs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finance_gl_accounts"
    ADD CONSTRAINT "finance_gl_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."finance_gl_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finance_journal_lines"
    ADD CONSTRAINT "finance_journal_lines_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "public"."finance_gl_accounts"("id");



ALTER TABLE ONLY "public"."finance_journal_lines"
    ADD CONSTRAINT "finance_journal_lines_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."finance_journals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."finance_purchase_items"
    ADD CONSTRAINT "finance_purchase_items_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "public"."finance_gl_accounts"("id");



ALTER TABLE ONLY "public"."finance_purchase_items"
    ADD CONSTRAINT "finance_purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."finance_purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."finance_purchases"
    ADD CONSTRAINT "finance_purchases_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "public"."finance_gl_accounts"("id");



ALTER TABLE ONLY "public"."finance_sales_items"
    ADD CONSTRAINT "finance_sales_items_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "public"."finance_gl_accounts"("id");



ALTER TABLE ONLY "public"."finance_sales_items"
    ADD CONSTRAINT "finance_sales_items_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."finance_sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_orders"
    ADD CONSTRAINT "job_orders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."machine_maintenance_checklists"
    ADD CONSTRAINT "machine_maintenance_checklists_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."machine_maintenance_logs"
    ADD CONSTRAINT "machine_maintenance_logs_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."machine_maintenance_checklists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."machine_maintenance_logs"
    ADD CONSTRAINT "machine_maintenance_logs_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."machine_maintenance_logs"
    ADD CONSTRAINT "machine_maintenance_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."machine_operator_users"
    ADD CONSTRAINT "machine_operator_users_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."machine_operator_users"
    ADD CONSTRAINT "machine_operator_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrk_clients"
    ADD CONSTRAINT "mrk_clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_digital_logs"
    ADD CONSTRAINT "mrk_digital_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_feedbacks"
    ADD CONSTRAINT "mrk_feedbacks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_invoices"
    ADD CONSTRAINT "mrk_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."mrk_clients"("id");



ALTER TABLE ONLY "public"."mrk_invoices"
    ADD CONSTRAINT "mrk_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_market_requests"
    ADD CONSTRAINT "mrk_market_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_market_requests"
    ADD CONSTRAINT "mrk_market_requests_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_market_requests"
    ADD CONSTRAINT "mrk_market_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_research_logins"
    ADD CONSTRAINT "mrk_research_logins_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrk_tenders"
    ADD CONSTRAINT "mrk_tenders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mrkt_activities"
    ADD CONSTRAINT "mrkt_activities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_activities"
    ADD CONSTRAINT "mrkt_activities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrkt_campaign_targets"
    ADD CONSTRAINT "mrkt_campaign_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrkt_campaigns"
    ADD CONSTRAINT "mrkt_campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_campaigns"
    ADD CONSTRAINT "mrkt_campaigns_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."mrkt_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_expenses"
    ADD CONSTRAINT "mrkt_expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_expenses"
    ADD CONSTRAINT "mrkt_expenses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrkt_expenses"
    ADD CONSTRAINT "mrkt_expenses_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_market_insights"
    ADD CONSTRAINT "mrkt_market_insights_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_plans"
    ADD CONSTRAINT "mrkt_plans_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_plans"
    ADD CONSTRAINT "mrkt_plans_parent_plan_id_fkey" FOREIGN KEY ("parent_plan_id") REFERENCES "public"."mrkt_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrkt_proforma_items"
    ADD CONSTRAINT "mrkt_proforma_items_product_service_id_fkey" FOREIGN KEY ("product_service_id") REFERENCES "public"."mrkt_products_services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_proforma_items"
    ADD CONSTRAINT "mrkt_proforma_items_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "public"."mrkt_proformas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrkt_proformas"
    ADD CONSTRAINT "mrkt_proformas_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_proformas"
    ADD CONSTRAINT "mrkt_proformas_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_proposal_items"
    ADD CONSTRAINT "mrkt_proposal_items_product_service_id_fkey" FOREIGN KEY ("product_service_id") REFERENCES "public"."mrkt_products_services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_proposal_items"
    ADD CONSTRAINT "mrkt_proposal_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."mrkt_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mrkt_proposals"
    ADD CONSTRAINT "mrkt_proposals_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_proposals"
    ADD CONSTRAINT "mrkt_proposals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_tenders"
    ADD CONSTRAINT "mrkt_tenders_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mrkt_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mrkt_tenders"
    ADD CONSTRAINT "mrkt_tenders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_sales_officer_id_fkey" FOREIGN KEY ("sales_officer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_communications"
    ADD CONSTRAINT "production_communications_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_communications"
    ADD CONSTRAINT "production_communications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_communications"
    ADD CONSTRAINT "production_communications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."read_notifications"
    ADD CONSTRAINT "read_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."read_notifications"
    ADD CONSTRAINT "read_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_captions"
    ADD CONSTRAINT "report_captions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_visits"
    ADD CONSTRAINT "site_visits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_visits"
    ADD CONSTRAINT "site_visits_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."warranties"
    ADD CONSTRAINT "warranties_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warranties"
    ADD CONSTRAINT "warranties_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warranties"
    ADD CONSTRAINT "warranties_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE SET NULL;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."clients";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deliveries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."design_versions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."designs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."feedbacks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."files";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."installations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inventory";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inventory_movements";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invoices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."machine_maintenance_checklists";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."machine_maintenance_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."machines";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."payments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."production_communications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."production_orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."read_notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."site_visits";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."test_proforma_invoices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."warranties";



GRANT USAGE ON SCHEMA "finance" TO "anon";
GRANT USAGE ON SCHEMA "finance" TO "authenticated";
GRANT USAGE ON SCHEMA "finance" TO "service_role";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";






















































































































































GRANT ALL ON FUNCTION "finance"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "finance"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "finance"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_inventory_movement"("p_inventory_id" "uuid", "p_user_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_reference_type" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_inventory_movement"("p_inventory_id" "uuid", "p_user_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_reference_type" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_inventory_movement"("p_inventory_id" "uuid", "p_user_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_reference_type" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."finance_update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."finance_update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."finance_update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_ai_attachments"("session_uuid" "uuid", "query_embedding" "public"."vector", "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_ai_attachments"("session_uuid" "uuid", "query_embedding" "public"."vector", "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_ai_attachments"("session_uuid" "uuid", "query_embedding" "public"."vector", "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_design_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_design_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_design_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_design_version_approved"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_design_version_approved"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_design_version_approved"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_design_version_sent"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_design_version_sent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_design_version_sent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_market_request_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_market_request_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_market_request_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_complaint"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_complaint"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_complaint"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_design"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_design"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_design"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_digital_content"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_digital_content"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_digital_content"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_feedback"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_feedback"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_feedback"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_invoice"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_invoice"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_invoice"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_market_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_market_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_market_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_marketing_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_marketing_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_marketing_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_marketing_invoice"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_marketing_invoice"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_marketing_invoice"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_production_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_production_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_production_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_research_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_research_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_research_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_rework"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_rework"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_rework"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_tender"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_tender"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_tender"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_order_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_payment_received"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_payment_received"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_payment_received"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_production_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_production_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_production_order_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."stamp_market_request_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."stamp_market_request_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stamp_market_request_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_push_devices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_push_devices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_push_devices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "finance"."finance_sync_log" TO "anon";
GRANT ALL ON TABLE "finance"."finance_sync_log" TO "authenticated";
GRANT ALL ON TABLE "finance"."finance_sync_log" TO "service_role";



GRANT ALL ON TABLE "finance"."gl_accounts" TO "anon";
GRANT ALL ON TABLE "finance"."gl_accounts" TO "authenticated";
GRANT ALL ON TABLE "finance"."gl_accounts" TO "service_role";



GRANT ALL ON TABLE "finance"."journal_lines" TO "anon";
GRANT ALL ON TABLE "finance"."journal_lines" TO "authenticated";
GRANT ALL ON TABLE "finance"."journal_lines" TO "service_role";



GRANT ALL ON TABLE "finance"."journals" TO "anon";
GRANT ALL ON TABLE "finance"."journals" TO "authenticated";
GRANT ALL ON TABLE "finance"."journals" TO "service_role";



GRANT ALL ON TABLE "finance"."payroll" TO "anon";
GRANT ALL ON TABLE "finance"."payroll" TO "authenticated";
GRANT ALL ON TABLE "finance"."payroll" TO "service_role";



GRANT ALL ON TABLE "finance"."purchase_items" TO "anon";
GRANT ALL ON TABLE "finance"."purchase_items" TO "authenticated";
GRANT ALL ON TABLE "finance"."purchase_items" TO "service_role";



GRANT ALL ON TABLE "finance"."purchases" TO "anon";
GRANT ALL ON TABLE "finance"."purchases" TO "authenticated";
GRANT ALL ON TABLE "finance"."purchases" TO "service_role";



GRANT ALL ON TABLE "finance"."sales" TO "anon";
GRANT ALL ON TABLE "finance"."sales" TO "authenticated";
GRANT ALL ON TABLE "finance"."sales" TO "service_role";



GRANT ALL ON TABLE "finance"."sales_items" TO "anon";
GRANT ALL ON TABLE "finance"."sales_items" TO "authenticated";
GRANT ALL ON TABLE "finance"."sales_items" TO "service_role";



GRANT ALL ON TABLE "finance"."tax_rates" TO "anon";
GRANT ALL ON TABLE "finance"."tax_rates" TO "authenticated";
GRANT ALL ON TABLE "finance"."tax_rates" TO "service_role";



GRANT ALL ON TABLE "public"."ai_attachment_chunks" TO "anon";
GRANT ALL ON TABLE "public"."ai_attachment_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_attachment_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."ai_attachments" TO "anon";
GRANT ALL ON TABLE "public"."ai_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."ai_chats" TO "anon";
GRANT ALL ON TABLE "public"."ai_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chats" TO "service_role";



GRANT ALL ON TABLE "public"."ai_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."client_contacts" TO "anon";
GRANT ALL ON TABLE "public"."client_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."complaints" TO "anon";
GRANT ALL ON TABLE "public"."complaints" TO "authenticated";
GRANT ALL ON TABLE "public"."complaints" TO "service_role";



GRANT ALL ON TABLE "public"."crt_design_bom" TO "anon";
GRANT ALL ON TABLE "public"."crt_design_bom" TO "authenticated";
GRANT ALL ON TABLE "public"."crt_design_bom" TO "service_role";



GRANT ALL ON TABLE "public"."crt_idea_hub" TO "anon";
GRANT ALL ON TABLE "public"."crt_idea_hub" TO "authenticated";
GRANT ALL ON TABLE "public"."crt_idea_hub" TO "service_role";



GRANT ALL ON TABLE "public"."crt_prototype_requests" TO "anon";
GRANT ALL ON TABLE "public"."crt_prototype_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."crt_prototype_requests" TO "service_role";



GRANT ALL ON TABLE "public"."crt_staff_leaves" TO "anon";
GRANT ALL ON TABLE "public"."crt_staff_leaves" TO "authenticated";
GRANT ALL ON TABLE "public"."crt_staff_leaves" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."design_communications" TO "anon";
GRANT ALL ON TABLE "public"."design_communications" TO "authenticated";
GRANT ALL ON TABLE "public"."design_communications" TO "service_role";



GRANT ALL ON TABLE "public"."design_versions" TO "anon";
GRANT ALL ON TABLE "public"."design_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."design_versions" TO "service_role";



GRANT ALL ON TABLE "public"."designs" TO "anon";
GRANT ALL ON TABLE "public"."designs" TO "authenticated";
GRANT ALL ON TABLE "public"."designs" TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."finance_gl_accounts" TO "anon";
GRANT ALL ON TABLE "public"."finance_gl_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_gl_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."finance_journal_lines" TO "anon";
GRANT ALL ON TABLE "public"."finance_journal_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_journal_lines" TO "service_role";



GRANT ALL ON TABLE "public"."finance_journals" TO "anon";
GRANT ALL ON TABLE "public"."finance_journals" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_journals" TO "service_role";



GRANT ALL ON TABLE "public"."finance_payroll" TO "anon";
GRANT ALL ON TABLE "public"."finance_payroll" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_payroll" TO "service_role";



GRANT ALL ON TABLE "public"."finance_purchase_items" TO "anon";
GRANT ALL ON TABLE "public"."finance_purchase_items" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_purchase_items" TO "service_role";



GRANT ALL ON TABLE "public"."finance_purchases" TO "anon";
GRANT ALL ON TABLE "public"."finance_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."finance_sales" TO "anon";
GRANT ALL ON TABLE "public"."finance_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_sales" TO "service_role";



GRANT ALL ON TABLE "public"."finance_sales_items" TO "anon";
GRANT ALL ON TABLE "public"."finance_sales_items" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_sales_items" TO "service_role";



GRANT ALL ON TABLE "public"."finance_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."finance_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."finance_tax_rates" TO "anon";
GRANT ALL ON TABLE "public"."finance_tax_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_tax_rates" TO "service_role";



GRANT ALL ON TABLE "public"."installations" TO "anon";
GRANT ALL ON TABLE "public"."installations" TO "authenticated";
GRANT ALL ON TABLE "public"."installations" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."job_orders" TO "anon";
GRANT ALL ON TABLE "public"."job_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."job_orders" TO "service_role";



GRANT ALL ON TABLE "public"."machine_maintenance_checklists" TO "anon";
GRANT ALL ON TABLE "public"."machine_maintenance_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."machine_maintenance_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."machine_maintenance_logs" TO "anon";
GRANT ALL ON TABLE "public"."machine_maintenance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."machine_maintenance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."machine_operator_users" TO "anon";
GRANT ALL ON TABLE "public"."machine_operator_users" TO "authenticated";
GRANT ALL ON TABLE "public"."machine_operator_users" TO "service_role";



GRANT ALL ON TABLE "public"."machines" TO "anon";
GRANT ALL ON TABLE "public"."machines" TO "authenticated";
GRANT ALL ON TABLE "public"."machines" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_clients" TO "anon";
GRANT ALL ON TABLE "public"."mrk_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_clients" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_digital_logs" TO "anon";
GRANT ALL ON TABLE "public"."mrk_digital_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_digital_logs" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."mrk_feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_invoices" TO "anon";
GRANT ALL ON TABLE "public"."mrk_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_market_requests" TO "anon";
GRANT ALL ON TABLE "public"."mrk_market_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_market_requests" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_research_logins" TO "anon";
GRANT ALL ON TABLE "public"."mrk_research_logins" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_research_logins" TO "service_role";



GRANT ALL ON TABLE "public"."mrk_tenders" TO "anon";
GRANT ALL ON TABLE "public"."mrk_tenders" TO "authenticated";
GRANT ALL ON TABLE "public"."mrk_tenders" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_activities" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_activities" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_campaign_targets" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_campaign_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_campaign_targets" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_expenses" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_market_insights" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_market_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_market_insights" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_plans" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_plans" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_products_services" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_products_services" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_products_services" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_proforma_items" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_proforma_items" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_proforma_items" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_proformas" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_proformas" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_proformas" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_proposal_items" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_proposal_items" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_proposal_items" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_proposals" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."mrkt_tenders" TO "anon";
GRANT ALL ON TABLE "public"."mrkt_tenders" TO "authenticated";
GRANT ALL ON TABLE "public"."mrkt_tenders" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."production_communications" TO "anon";
GRANT ALL ON TABLE "public"."production_communications" TO "authenticated";
GRANT ALL ON TABLE "public"."production_communications" TO "service_role";



GRANT ALL ON TABLE "public"."production_orders" TO "anon";
GRANT ALL ON TABLE "public"."production_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."production_orders" TO "service_role";



GRANT ALL ON TABLE "public"."push_devices" TO "anon";
GRANT ALL ON TABLE "public"."push_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."push_devices" TO "service_role";



GRANT ALL ON TABLE "public"."read_notifications" TO "anon";
GRANT ALL ON TABLE "public"."read_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."read_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."report_captions" TO "anon";
GRANT ALL ON TABLE "public"."report_captions" TO "authenticated";
GRANT ALL ON TABLE "public"."report_captions" TO "service_role";



GRANT ALL ON TABLE "public"."site_visits" TO "anon";
GRANT ALL ON TABLE "public"."site_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."site_visits" TO "service_role";



GRANT ALL ON TABLE "public"."test_proforma_invoices" TO "anon";
GRANT ALL ON TABLE "public"."test_proforma_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."test_proforma_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."warranties" TO "anon";
GRANT ALL ON TABLE "public"."warranties" TO "authenticated";
GRANT ALL ON TABLE "public"."warranties" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































