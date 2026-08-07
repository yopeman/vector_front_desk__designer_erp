


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



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


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


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


CREATE TYPE "public"."vat_status" AS ENUM (
    'with_vat',
    'without_vat'
);


ALTER TYPE "public"."vat_status" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce((select role from public.users where id = auth.uid()) in ('admin', 'admin_marketer'), false);
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    CONSTRAINT "installations_status_check" CHECK (("status" = ANY (ARRAY['Scheduled'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."installations" OWNER TO "postgres";


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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
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
    CONSTRAINT "production_orders_job_type_check" CHECK (("job_type" = ANY (ARRAY['received'::"text", 'rework'::"text"]))),
    CONSTRAINT "production_orders_priority_check" CHECK (("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text"]))),
    CONSTRAINT "production_orders_quality_status_check" CHECK (("quality_status" = ANY (ARRAY['Pass'::"text", 'Fail'::"text", 'Pending'::"text"]))),
    CONSTRAINT "production_orders_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'In Progress'::"text", 'Completed'::"text", 'Cancelled'::"text"]))),
    CONSTRAINT "production_orders_task_type_check" CHECK (("task_type" = ANY (ARRAY['project'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."production_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."read_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone
);


ALTER TABLE "public"."read_notifications" OWNER TO "postgres";


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
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'designer'::"text", 'front_desk'::"text", 'machine_operator'::"text", 'marketer'::"text", 'admin_marketer'::"text"])))
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


ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."read_notifications"
    ADD CONSTRAINT "read_notifications_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_installations_client_id" ON "public"."installations" USING "btree" ("client_id");



CREATE INDEX "idx_installations_job_order_id" ON "public"."installations" USING "btree" ("job_order_id");



CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoices_order_id" ON "public"."invoices" USING "btree" ("order_id");



CREATE INDEX "idx_job_orders_invoice_id" ON "public"."job_orders" USING "btree" ("invoice_id");



CREATE INDEX "idx_machine_maintenance_checklists_machine_id" ON "public"."machine_maintenance_checklists" USING "btree" ("machine_id");



CREATE INDEX "idx_machine_maintenance_checklists_type" ON "public"."machine_maintenance_checklists" USING "btree" ("checklist_type");



CREATE INDEX "idx_machine_maintenance_logs_checklist_id" ON "public"."machine_maintenance_logs" USING "btree" ("checklist_id");



CREATE INDEX "idx_machine_maintenance_logs_machine_id" ON "public"."machine_maintenance_logs" USING "btree" ("machine_id");



CREATE INDEX "idx_machine_maintenance_logs_performed_at" ON "public"."machine_maintenance_logs" USING "btree" ("performed_at" DESC);



CREATE INDEX "idx_machine_maintenance_logs_performed_by" ON "public"."machine_maintenance_logs" USING "btree" ("performed_by");



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



CREATE INDEX "idx_production_orders_designer_id" ON "public"."production_orders" USING "btree" ("designer_id");



CREATE INDEX "idx_production_orders_job_type" ON "public"."production_orders" USING "btree" ("job_type");



CREATE INDEX "idx_production_orders_machine_id" ON "public"."production_orders" USING "btree" ("machine_id");



CREATE INDEX "idx_production_orders_order_id" ON "public"."production_orders" USING "btree" ("order_id");



CREATE INDEX "idx_production_orders_priority" ON "public"."production_orders" USING "btree" ("priority");



CREATE INDEX "idx_production_orders_status" ON "public"."production_orders" USING "btree" ("status");



CREATE INDEX "idx_read_notifications_notification_id" ON "public"."read_notifications" USING "btree" ("notification_id");



CREATE INDEX "idx_read_notifications_user_id" ON "public"."read_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_site_visits_client_id" ON "public"."site_visits" USING "btree" ("client_id");



CREATE INDEX "idx_site_visits_status" ON "public"."site_visits" USING "btree" ("status");



CREATE INDEX "idx_test_proforma_invoices_client_name" ON "public"."test_proforma_invoices" USING "btree" ("client_name");



CREATE INDEX "idx_test_proforma_invoices_invoice_no" ON "public"."test_proforma_invoices" USING "btree" ("invoice_no");



CREATE INDEX "idx_test_proforma_invoices_status" ON "public"."test_proforma_invoices" USING "btree" ("status");



CREATE INDEX "idx_users_department_id" ON "public"."users" USING "btree" ("department_id");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_warranties_client_id" ON "public"."warranties" USING "btree" ("client_id");



CREATE INDEX "idx_warranties_order_id" ON "public"."warranties" USING "btree" ("order_id");



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



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."read_notifications"
    ADD CONSTRAINT "read_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."read_notifications"
    ADD CONSTRAINT "read_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



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



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_department_id" "uuid", "p_title" "text", "p_body" "text", "p_icon" "text", "p_color" "text", "p_priority" "text", "p_category" "text", "p_entity_type" "text", "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."stamp_market_request_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."stamp_market_request_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stamp_market_request_approval"() TO "service_role";



GRANT ALL ON TABLE "public"."client_contacts" TO "anon";
GRANT ALL ON TABLE "public"."client_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."complaints" TO "anon";
GRANT ALL ON TABLE "public"."complaints" TO "authenticated";
GRANT ALL ON TABLE "public"."complaints" TO "service_role";



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



GRANT ALL ON TABLE "public"."installations" TO "anon";
GRANT ALL ON TABLE "public"."installations" TO "authenticated";
GRANT ALL ON TABLE "public"."installations" TO "service_role";



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



GRANT ALL ON TABLE "public"."production_orders" TO "anon";
GRANT ALL ON TABLE "public"."production_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."production_orders" TO "service_role";



GRANT ALL ON TABLE "public"."read_notifications" TO "anon";
GRANT ALL ON TABLE "public"."read_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."read_notifications" TO "service_role";



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







