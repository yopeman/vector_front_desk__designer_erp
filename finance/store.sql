


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



CREATE OR REPLACE FUNCTION "public"."approve_registration"("registration_id" "uuid", "admin_user_id" "uuid", "assigned_role" character varying) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    reg_email VARCHAR;
    reg_full_name VARCHAR;
    reg_department_id UUID;
    auth_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Get registration details
    SELECT email, full_name, department_id INTO reg_email, reg_full_name, reg_department_id
    FROM registrations
    WHERE id = registration_id AND status = 'pending';
    
    IF reg_email IS NULL THEN
        RETURN 'ERROR: Registration not found or already processed';
    END IF;
    
    -- Check if auth user exists
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = reg_email
    LIMIT 1;
    
    IF auth_user_id IS NULL THEN
        RETURN 'ERROR: Auth user not found. User must complete auth setup first.';
    END IF;
    
    -- Check if user already exists in custom table
    SELECT id INTO existing_user_id
    FROM users
    WHERE id = auth_user_id
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE users
        SET 
            role = assigned_role,
            full_name = reg_full_name,
            department_id = reg_department_id,
            registration_status = 'active',
            approved_by = admin_user_id,
            approved_date = NOW(),
            is_active = true
        WHERE id = auth_user_id;
    ELSE
        -- Insert new user
        INSERT INTO users (id, email, password_hash, full_name, role, department_id, registration_status, registration_date, approved_by, approved_date, is_active)
        VALUES (
            auth_user_id,
            reg_email,
            'managed_by_supabase_auth',
            reg_full_name,
            assigned_role,
            reg_department_id,
            'active',
            NOW(),
            admin_user_id,
            NOW(),
            true
        );
    END IF;
    
    -- Update registration status
    UPDATE registrations
    SET 
        status = 'approved',
        processed_by = admin_user_id,
        processed_date = NOW()
    WHERE id = registration_id;
    
    -- Create notification for the user
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
        auth_user_id,
        'Registration Approved',
        'Your registration has been approved. You can now log in to the ERP system.',
        'General',
        'registrations',
        registration_id
    );
    
    RETURN 'SUCCESS: Registration approved for ' || reg_email;
END;
$$;


ALTER FUNCTION "public"."approve_registration"("registration_id" "uuid", "admin_user_id" "uuid", "assigned_role" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_from_email"("user_email" character varying, "user_role" character varying, "user_full_name" character varying, "user_department_code" character varying) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    auth_user_id UUID;
    department_id UUID;
    existing_user_id UUID;
BEGIN
    -- Get the auth user ID from auth.users
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF auth_user_id IS NULL THEN
        RETURN 'ERROR: Auth user not found for email: ' || user_email;
    END IF;
    
    -- Check if user already exists in custom table
    SELECT id INTO existing_user_id
    FROM users
    WHERE id = auth_user_id
    LIMIT 1;
    
    -- Get department ID
    SELECT id INTO department_id
    FROM departments
    WHERE code = user_department_code
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE users
        SET 
            role = user_role,
            full_name = user_full_name,
            department_id = department_id,
            is_active = true
        WHERE id = auth_user_id;
        
        RETURN 'UPDATED: ' || user_email || ' as ' || user_role;
    ELSE
        -- Insert new user
        INSERT INTO users (id, email, password_hash, full_name, role, department_id, is_active)
        VALUES (
            auth_user_id,
            user_email,
            'managed_by_supabase_auth', -- Dummy value since auth is handled by Supabase
            user_full_name,
            user_role,
            department_id,
            true
        );
        
        RETURN 'CREATED: ' || user_email || ' as ' || user_role;
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_user_from_email"("user_email" character varying, "user_role" character varying, "user_full_name" character varying, "user_department_code" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_notification"("target_user_id" "uuid", "notification_title" character varying, "notification_message" "text", "notification_type" character varying, "ref_type" character varying DEFAULT NULL::character varying, "ref_id" "uuid" DEFAULT NULL::"uuid", "ref_code" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_notification_id UUID;
BEGIN
    INSERT INTO user_notifications (
        user_id, title, message, type, 
        reference_type, reference_id, reference_code
    )
    VALUES (
        target_user_id, notification_title, notification_message, notification_type,
        ref_type, ref_id, ref_code
    )
    RETURNING id INTO new_notification_id;
    
    RETURN new_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_user_notification"("target_user_id" "uuid", "notification_title" character varying, "notification_message" "text", "notification_type" character varying, "ref_type" character varying, "ref_id" "uuid", "ref_code" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_private_conversation"("user1_id" "uuid", "user2_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    conversation_record RECORD;
    new_conversation_id UUID;
    random_int INTEGER;
BEGIN
    -- Check if conversation already exists between these two users
    SELECT c.id INTO conversation_record
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = user1_id 
    AND cp2.user_id = user2_id
    AND c.type = 'private'
    LIMIT 1;
    
    IF conversation_record.id IS NOT NULL THEN
        RETURN conversation_record.id;
    END IF;
    
    -- Create new conversation
    random_int := (random() * 16777215)::INTEGER;
    INSERT INTO conversations (conversation_code, type, created_by)
    VALUES (
        'CONV-' || to_hex(random_int),
        'private',
        user1_id
    )
    RETURNING id INTO new_conversation_id;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (new_conversation_id, user1_id), (new_conversation_id, user2_id);
    
    RETURN new_conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_private_conversation"("user1_id" "uuid", "user2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_stock_balance_with_alert"() RETURNS TABLE("item_code" character varying, "item_name" character varying, "category" character varying, "balance" numeric, "reorder_level" numeric, "unit_cost" numeric, "total_value" numeric, "is_low_stock" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.code,
        s.name,
        s.category,
        s.balance,
        s.reorder_level,
        s.unit_cost,
        (s.balance * s.unit_cost),
        (s.balance <= s.reorder_level)
    FROM stock_items s
    ORDER BY s.category, s.name;
END;
$$;


ALTER FUNCTION "public"."get_stock_balance_with_alert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM chat_messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = user_id
    AND cp.is_active = TRUE
    AND m.sender_id != user_id
    AND m.is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_message_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_messages_read"("user_id" "uuid", "conversation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE conversation_participants
    SET last_read_at = NOW()
    WHERE user_id = user_id AND conversation_id = conversation_id;
    
    UPDATE chat_messages
    SET is_read = TRUE, read_at = NOW()
    WHERE conversation_id = conversation_id
    AND sender_id != user_id
    AND is_read = FALSE;
END;
$$;


ALTER FUNCTION "public"."mark_conversation_messages_read"("user_id" "uuid", "conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_registration"("registration_id" "uuid", "admin_user_id" "uuid", "rejection_reason_text" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    reg_email VARCHAR;
BEGIN
    -- Get registration details
    SELECT email INTO reg_email
    FROM registrations
    WHERE id = registration_id AND status = 'pending';
    
    IF reg_email IS NULL THEN
        RETURN 'ERROR: Registration not found or already processed';
    END IF;
    
    -- Update registration status
    UPDATE registrations
    SET 
        status = 'rejected',
        processed_by = admin_user_id,
        processed_date = NOW(),
        rejection_reason = rejection_reason_text
    WHERE id = registration_id;
    
    -- Try to update user if exists
    UPDATE users
    SET 
        registration_status = 'rejected',
        rejection_reason = rejection_reason_text,
        is_active = false
    WHERE email = reg_email;
    
    RETURN 'SUCCESS: Registration rejected for ' || reg_email;
END;
$$;


ALTER FUNCTION "public"."reject_registration"("registration_id" "uuid", "admin_user_id" "uuid", "rejection_reason_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_after_grv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'Received' AND OLD.status != 'Received' THEN
        UPDATE stock_items 
        SET balance = balance + NEW.quantity,
            last_updated = NEW.date
        WHERE id = NEW.stock_item_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stock_after_grv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_after_siv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'Issued' AND OLD.status != 'Issued' THEN
        UPDATE stock_items 
        SET balance = GREATEST(0, balance - NEW.quantity),
            last_updated = NEW.date
        WHERE id = NEW.stock_item_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stock_after_siv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_settings_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "time" timestamp with time zone DEFAULT "now"(),
    "label" character varying(100) NOT NULL,
    "detail" "text",
    "color" character varying(50),
    "icon" character varying(50),
    "entity_type" character varying(50),
    "entity_id" "uuid"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_transfers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transfer_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "reference_no" character varying(100),
    "from_location" character varying(255) NOT NULL,
    "to_location" character varying(255) NOT NULL,
    "stock_item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "condition_status" character varying(100),
    "received_by" "uuid",
    "status" character varying(50) DEFAULT 'In Transit'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "asset_transfers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['In Transit'::character varying, 'Received'::character varying])::"text"[])))
);


ALTER TABLE "public"."asset_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auction_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auction_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "quantity" numeric(10,2) NOT NULL,
    "unit" character varying(50),
    "estimated_price" numeric(15,2),
    "category" character varying(100),
    "specifications" "jsonb",
    "minimum_order_quantity" numeric(10,2),
    "delivery_requirements" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."auction_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auction_timeline" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auction_id" "uuid",
    "event_type" character varying(50) NOT NULL,
    "description" "text" NOT NULL,
    "user_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."auction_timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auctions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "start_date" timestamp without time zone,
    "end_date" timestamp without time zone,
    "winning_bid_id" "uuid",
    "winning_supplier_id" "uuid",
    "purchase_order_id" "uuid",
    "total_value" numeric(15,2),
    "savings" numeric(15,2),
    "auction_type" character varying(50) DEFAULT 'standard'::character varying,
    "min_bid_amount" numeric(15,2),
    "bid_increment" numeric(15,2)
);


ALTER TABLE "public"."auctions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(100) NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" character varying(45),
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bid_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "bid_id" "uuid",
    "auction_item_id" "uuid",
    "unit_price" numeric(15,2) NOT NULL,
    "total_price" numeric(15,2) NOT NULL,
    "notes" "text",
    "specifications" "text",
    "delivery_date" "date",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."bid_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bids" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auction_id" "uuid",
    "supplier_id" "uuid",
    "supplier_name" character varying(255),
    "total_amount" numeric(15,2) NOT NULL,
    "unit_price_average" numeric(15,2),
    "status" character varying(50) DEFAULT 'submitted'::character varying,
    "submitted_at" timestamp without time zone DEFAULT "now"(),
    "revised_at" timestamp without time zone,
    "notes" "text",
    "terms" "text",
    "payment_terms" character varying(255),
    "delivery_period" integer,
    "validity_period" integer,
    "is_selected" boolean DEFAULT false,
    "disqualification_reason" "text"
);


ALTER TABLE "public"."bids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid",
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'text'::character varying,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_messages_message_type_check" CHECK ((("message_type")::"text" = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'file'::character varying, 'system'::character varying])::"text"[])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comparison_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comparison_session_id" "uuid",
    "item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "unit" character varying(50) NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comparison_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comparison_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid",
    "selected_vendor_id" "uuid",
    "status" character varying(50) DEFAULT 'in_progress'::character varying,
    "comparison_notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "comparison_sessions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."comparison_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid",
    "user_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_code" character varying(50) NOT NULL,
    "type" character varying(20) DEFAULT 'private'::character varying NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversations_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['private'::character varying, 'group'::character varying])::"text"[])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "creditor_name" character varying(255) NOT NULL,
    "creditor_contact" character varying(255),
    "product_name" character varying(255) NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "transaction_type" character varying(50) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "due_date" "date",
    "paid_amount" numeric(15,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "price_type" character varying(20) DEFAULT 'without_vat'::character varying,
    CONSTRAINT "check_credit_price_type" CHECK ((("price_type")::"text" = ANY ((ARRAY['with_vat'::character varying, 'without_vat'::character varying])::"text"[]))),
    CONSTRAINT "credit_transactions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'partial'::character varying, 'paid'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY ((ARRAY['credit_given'::character varying, 'credit_received'::character varying, 'buy_product'::character varying])::"text"[])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."credit_transactions"."price_type" IS 'Indicates if the unit price includes VAT (with_vat) or excludes VAT (without_vat).';



CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."end_of_day_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "report_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "staff_name" character varying(255) NOT NULL,
    "activities" "text" NOT NULL,
    "items_issued" integer DEFAULT 0,
    "items_received" integer DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."end_of_day_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goods_receiving_vouchers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "grv_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "invoice_no" character varying(100),
    "supplier_id" "uuid",
    "stock_item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "unit" character varying(50) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "vat_amount" numeric(15,2) DEFAULT 0,
    "without_vat_total" numeric(15,2) NOT NULL,
    "with_vat_total" numeric(15,2) NOT NULL,
    "issued_by" "uuid",
    "received_by" "uuid",
    "amount_comparison" character varying(50) DEFAULT 'Matched'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'Received'::character varying NOT NULL,
    "purchase_request_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "purchase_order_id" "uuid",
    "price_type" character varying(20) DEFAULT 'without_vat'::character varying,
    "created_from" character varying(20) DEFAULT 'manual'::character varying,
    CONSTRAINT "check_created_from" CHECK ((("created_from")::"text" = ANY ((ARRAY['auto'::character varying, 'manual'::character varying])::"text"[]))),
    CONSTRAINT "check_price_type" CHECK ((("price_type")::"text" = ANY ((ARRAY['with_vat'::character varying, 'without_vat'::character varying])::"text"[]))),
    CONSTRAINT "goods_receiving_vouchers_amount_comparison_check" CHECK ((("amount_comparison")::"text" = ANY ((ARRAY['Matched'::character varying, 'Discrepancy'::character varying, 'Pending Review'::character varying])::"text"[]))),
    CONSTRAINT "goods_receiving_vouchers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'received'::character varying, 'processed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."goods_receiving_vouchers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."goods_receiving_vouchers"."supplier_id" IS 'Supplier ID - can be null if supplier not yet determined or for manual GRV entries';



COMMENT ON COLUMN "public"."goods_receiving_vouchers"."price_type" IS 'Indicates if the unit price includes VAT (with_vat) or excludes VAT (without_vat). with_vat means price already includes 15% VAT, without_vat means VAT will be added.';



COMMENT ON COLUMN "public"."goods_receiving_vouchers"."created_from" IS 'Indicates how the GRV was created: auto (from purchase request approval) or manual (direct entry).';



CREATE TABLE IF NOT EXISTS "public"."note_checklist_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "note_id" "uuid",
    "text" "text" NOT NULL,
    "done" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."note_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" character varying(255) NOT NULL,
    "content" "text",
    "color" character varying(20) DEFAULT 'default'::character varying,
    "done" boolean DEFAULT false,
    "pinned" boolean DEFAULT false,
    "date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notes_color_check" CHECK ((("color")::"text" = ANY ((ARRAY['default'::character varying, 'red'::character varying, 'orange'::character varying, 'yellow'::character varying, 'green'::character varying, 'blue'::character varying, 'purple'::character varying, 'pink'::character varying])::"text"[])))
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text",
    "type" "text" DEFAULT 'info'::"text",
    "reference_type" "text",
    "reference_id" "text",
    "reference_code" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "department_id" "uuid",
    "requested_role" character varying(50) NOT NULL,
    "phone" character varying(20),
    "registration_date" timestamp with time zone DEFAULT "now"(),
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "processed_by" "uuid",
    "processed_date" timestamp with time zone,
    "rejection_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auth_user_id" "uuid",
    CONSTRAINT "registrations_requested_role_check" CHECK ((("requested_role")::"text" = ANY ((ARRAY['Store Keeper'::character varying, 'Purchaser'::character varying, 'Staff'::character varying, 'CEO/Manager'::character varying, 'Admin'::character varying])::"text"[]))),
    CONSTRAINT "registrations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pending_registrations_view" AS
 SELECT "r"."id",
    "r"."email",
    "r"."full_name",
    "r"."requested_role",
    "d"."name" AS "department_name",
    "r"."phone",
    "r"."registration_date",
    "r"."notes"
   FROM ("public"."registrations" "r"
     LEFT JOIN "public"."departments" "d" ON (("r"."department_id" = "d"."id")))
  WHERE (("r"."status")::"text" = 'pending'::"text")
  ORDER BY "r"."registration_date" DESC;


ALTER VIEW "public"."pending_registrations_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item_name" character varying(255) NOT NULL,
    "supplier_id" "uuid",
    "supplier_name" character varying(255),
    "unit_price" numeric(15,2) NOT NULL,
    "quantity" numeric(10,2),
    "total_price" numeric(15,2),
    "purchase_date" timestamp without time zone DEFAULT "now"(),
    "purchase_request_id" "uuid",
    "auction_id" "uuid",
    "bid_id" "uuid",
    "purchase_order_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "purchase_order_id" "uuid",
    "auction_item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "quantity" numeric(10,2) NOT NULL,
    "unit" character varying(50),
    "unit_price" numeric(15,2) NOT NULL,
    "total_price" numeric(15,2) NOT NULL,
    "specifications" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "po_number" character varying(50) NOT NULL,
    "auction_id" "uuid",
    "supplier_id" "uuid",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_from" character varying(50) DEFAULT 'auction'::character varying,
    "total_amount" numeric(15,2) NOT NULL,
    "currency" character varying(10) DEFAULT 'ETB'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "confirmed_at" timestamp without time zone,
    "expected_delivery_date" "date",
    "actual_delivery_date" "date",
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "notes" "text",
    "terms_conditions" "text"
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pr_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "requested_date" "date" NOT NULL,
    "stock_item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "unit" character varying(50) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "allowed_quantity" numeric(15,2),
    "unit_price" numeric(15,2),
    "total_amount" numeric(15,2),
    "supplier_id" "uuid",
    "requested_by" "uuid",
    "checked_by" "uuid",
    "authorized_by" "uuid",
    "approved_by" "uuid",
    "status" character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    "approval_comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "request_purpose" "text",
    "auto_generated" boolean DEFAULT false,
    "reference_type" character varying(50),
    "reference_id" "uuid",
    "grv_id" "uuid",
    "price_type" character varying(20) DEFAULT 'without_vat'::character varying,
    CONSTRAINT "check_purchase_price_type" CHECK ((("price_type")::"text" = ANY ((ARRAY['with_vat'::character varying, 'without_vat'::character varying])::"text"[]))),
    CONSTRAINT "purchase_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."purchase_requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."purchase_requests"."price_type" IS 'Indicates if the unit price includes VAT (with_vat) or excludes VAT (without_vat).';



CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" character varying(100) NOT NULL,
    "value" "text",
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sr_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "staff_name" character varying(255) NOT NULL,
    "stock_item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "purpose" "text",
    "status" character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "requested_by" "uuid",
    "unit" character varying(50),
    "allowed_quantity" numeric(15,2),
    "time" time without time zone DEFAULT CURRENT_TIME,
    "request_type" character varying(50) DEFAULT 'staff'::character varying,
    CONSTRAINT "staff_requests_request_type_check" CHECK ((("request_type")::"text" = ANY ((ARRAY['staff'::character varying, 'purchaser'::character varying])::"text"[]))),
    CONSTRAINT "staff_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."staff_requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."staff_requests"."unit" IS 'Unit of measurement for the requested item';



COMMENT ON COLUMN "public"."staff_requests"."allowed_quantity" IS 'Quantity approved by store keeper (can be different from requested quantity)';



COMMENT ON COLUMN "public"."staff_requests"."time" IS 'Time when the request was submitted';



COMMENT ON COLUMN "public"."staff_requests"."request_type" IS 'Type of request: staff or purchaser';



CREATE TABLE IF NOT EXISTS "public"."stock_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(50) NOT NULL,
    "unit" character varying(50) NOT NULL,
    "unit_cost" numeric(15,2) DEFAULT 0 NOT NULL,
    "balance" numeric(15,2) DEFAULT 0 NOT NULL,
    "reorder_level" numeric(15,2) DEFAULT 0 NOT NULL,
    "maximum_stock_level" numeric(15,2) DEFAULT 0 NOT NULL,
    "location" character varying(255),
    "supplier_id" "uuid",
    "last_updated" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_items_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['Consumable'::character varying, 'Fixed Asset'::character varying])::"text"[])))
);


ALTER TABLE "public"."stock_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "movement_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "stock_item_id" "uuid" NOT NULL,
    "item_name" character varying(255) NOT NULL,
    "movement_type" character varying(50) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "balance_before" numeric(15,2) NOT NULL,
    "balance_after" numeric(15,2) NOT NULL,
    "reference_type" character varying(50) NOT NULL,
    "reference_id" "uuid",
    "reference_code" character varying(50),
    "performed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_movements_movement_type_check" CHECK ((("movement_type")::"text" = ANY ((ARRAY['IN'::character varying, 'OUT'::character varying])::"text"[]))),
    CONSTRAINT "stock_movements_reference_type_check" CHECK ((("reference_type")::"text" = ANY ((ARRAY['GRV'::character varying, 'SIV'::character varying, 'Adjustment'::character varying, 'Transfer'::character varying])::"text"[])))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_issue_vouchers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "siv_code" character varying(50) NOT NULL,
    "date" "date" NOT NULL,
    "type" character varying(50) NOT NULL,
    "issued_to" character varying(255) NOT NULL,
    "stock_item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "unit" character varying(50) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "unit_cost" numeric(15,2) NOT NULL,
    "total_cost" numeric(15,2) NOT NULL,
    "purpose" "text",
    "status" character varying(50) DEFAULT 'Issued'::character varying NOT NULL,
    "issued_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "staff_request_id" "uuid",
    CONSTRAINT "store_issue_vouchers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Issued'::character varying, 'Pending'::character varying, 'Completed'::character varying])::"text"[]))),
    CONSTRAINT "store_issue_vouchers_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['Consumable'::character varying, 'Customer Service'::character varying, 'Project/Samples'::character varying])::"text"[])))
);


ALTER TABLE "public"."store_issue_vouchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "supplier_id" "uuid",
    "auction_id" "uuid",
    "purchase_order_id" "uuid",
    "type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "status" character varying(50) DEFAULT 'unread'::character varying,
    "action_required" boolean DEFAULT false,
    "action_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "read_at" timestamp without time zone
);


ALTER TABLE "public"."supplier_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" character varying(255) NOT NULL,
    "contact_name" character varying(255),
    "email" character varying(255) NOT NULL,
    "phone" character varying(50),
    "address" "text",
    "rating" numeric(3,2) DEFAULT 0,
    "total_orders" integer DEFAULT 0,
    "total_value" numeric(15,2) DEFAULT 0,
    "on_time_delivery_rate" numeric(5,2) DEFAULT 0,
    "quality_score" numeric(3,2) DEFAULT 0,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "specialties" "text"[],
    "payment_terms" character varying(255),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transport_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "item" character varying(255) NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "location" character varying(255) NOT NULL,
    "payment_amount" numeric(15,2) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."transport_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying(50) DEFAULT 'System'::character varying NOT NULL,
    "reference_type" character varying(50),
    "reference_id" "uuid",
    "reference_code" character varying(50),
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_notifications_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['Low Stock'::character varying, 'Payment Reminder'::character varying, 'Approval'::character varying, 'Transfer'::character varying, 'System'::character varying, 'Message'::character varying, 'Task'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stock_alert_threshold" integer DEFAULT 10,
    "enable_auto_purchase_request" boolean DEFAULT false,
    "reorder_multiplier" numeric DEFAULT 1.5,
    "in_app_alerts" boolean DEFAULT true,
    "low_stock_alerts" boolean DEFAULT true,
    "approval_requests" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "department_id" "uuid",
    "phone" character varying(20),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registration_status" character varying(50) DEFAULT 'active'::character varying,
    "registration_date" timestamp with time zone,
    "rejection_reason" "text",
    "approved_by" "uuid",
    "approved_date" timestamp with time zone,
    "department" character varying(100),
    "role" "text" DEFAULT 'Staff'::"text" NOT NULL,
    CONSTRAINT "users_registration_status_check" CHECK ((("registration_status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'rejected'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_quote_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid",
    "item_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "unit" character varying(50) NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "line_total" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendor_quote_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "purchase_request_id" "uuid",
    "transport_cost" numeric(10,2) DEFAULT 500.00,
    "tax_rate" numeric(5,2) DEFAULT 15.00,
    "subtotal" numeric(15,2) DEFAULT 0.00,
    "tax_amount" numeric(15,2) DEFAULT 0.00,
    "grand_total" numeric(15,2) DEFAULT 0.00,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vendor_quotes_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'submitted'::character varying, 'accepted'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."vendor_quotes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_transfer_code_key" UNIQUE ("transfer_code");



ALTER TABLE ONLY "public"."auction_items"
    ADD CONSTRAINT "auction_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auction_timeline"
    ADD CONSTRAINT "auction_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auctions"
    ADD CONSTRAINT "auctions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bid_items"
    ADD CONSTRAINT "bid_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparison_items"
    ADD CONSTRAINT "comparison_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparison_sessions"
    ADD CONSTRAINT "comparison_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_conversation_code_key" UNIQUE ("conversation_code");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."end_of_day_reports"
    ADD CONSTRAINT "end_of_day_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."end_of_day_reports"
    ADD CONSTRAINT "end_of_day_reports_report_code_key" UNIQUE ("report_code");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_grv_code_key" UNIQUE ("grv_code");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_checklist_items"
    ADD CONSTRAINT "note_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_pr_code_key" UNIQUE ("pr_code");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_requests"
    ADD CONSTRAINT "staff_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_requests"
    ADD CONSTRAINT "staff_requests_sr_code_key" UNIQUE ("sr_code");



ALTER TABLE ONLY "public"."stock_items"
    ADD CONSTRAINT "stock_items_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."stock_items"
    ADD CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_movement_code_key" UNIQUE ("movement_code");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_issue_vouchers"
    ADD CONSTRAINT "store_issue_vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_issue_vouchers"
    ADD CONSTRAINT "store_issue_vouchers_siv_code_key" UNIQUE ("siv_code");



ALTER TABLE ONLY "public"."supplier_notifications"
    ADD CONSTRAINT "supplier_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transport_costs"
    ADD CONSTRAINT "transport_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_quote_items"
    ADD CONSTRAINT "vendor_quote_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_quotes"
    ADD CONSTRAINT "vendor_quotes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_entity" ON "public"."activities" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activities_time" ON "public"."activities" USING "btree" ("time" DESC);



CREATE INDEX "idx_activities_user_id" ON "public"."activities" USING "btree" ("user_id");



CREATE INDEX "idx_asset_transfers_code" ON "public"."asset_transfers" USING "btree" ("transfer_code");



CREATE INDEX "idx_asset_transfers_date" ON "public"."asset_transfers" USING "btree" ("date");



CREATE INDEX "idx_asset_transfers_status" ON "public"."asset_transfers" USING "btree" ("status");



CREATE INDEX "idx_asset_transfers_stock_item" ON "public"."asset_transfers" USING "btree" ("stock_item_id");



CREATE INDEX "idx_auction_items_auction_id" ON "public"."auction_items" USING "btree" ("auction_id");



CREATE INDEX "idx_auction_timeline_auction_id" ON "public"."auction_timeline" USING "btree" ("auction_id");



CREATE INDEX "idx_auctions_created_by" ON "public"."auctions" USING "btree" ("created_by");



CREATE INDEX "idx_auctions_status" ON "public"."auctions" USING "btree" ("status");



CREATE INDEX "idx_audit_logs_date" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_bid_items_bid_id" ON "public"."bid_items" USING "btree" ("bid_id");



CREATE INDEX "idx_bids_auction_id" ON "public"."bids" USING "btree" ("auction_id");



CREATE INDEX "idx_bids_status" ON "public"."bids" USING "btree" ("status");



CREATE INDEX "idx_bids_supplier_id" ON "public"."bids" USING "btree" ("supplier_id");



CREATE INDEX "idx_chat_messages_conversation" ON "public"."chat_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_chat_messages_is_read" ON "public"."chat_messages" USING "btree" ("is_read");



CREATE INDEX "idx_chat_messages_sender" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_comparison_items_session_id" ON "public"."comparison_items" USING "btree" ("comparison_session_id");



CREATE INDEX "idx_comparison_sessions_purchase_request_id" ON "public"."comparison_sessions" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_comparison_sessions_status" ON "public"."comparison_sessions" USING "btree" ("status");



CREATE INDEX "idx_conversation_participants_active" ON "public"."conversation_participants" USING "btree" ("is_active");



CREATE INDEX "idx_conversation_participants_conversation" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_code" ON "public"."conversations" USING "btree" ("conversation_code");



CREATE INDEX "idx_conversations_created_by" ON "public"."conversations" USING "btree" ("created_by");



CREATE INDEX "idx_conversations_type" ON "public"."conversations" USING "btree" ("type");



CREATE INDEX "idx_credit_transactions_creditor" ON "public"."credit_transactions" USING "btree" ("creditor_name");



CREATE INDEX "idx_credit_transactions_date" ON "public"."credit_transactions" USING "btree" ("date");



CREATE INDEX "idx_credit_transactions_status" ON "public"."credit_transactions" USING "btree" ("status");



CREATE INDEX "idx_credit_transactions_type" ON "public"."credit_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_departments_code" ON "public"."departments" USING "btree" ("code");



CREATE INDEX "idx_departments_name" ON "public"."departments" USING "btree" ("name");



CREATE INDEX "idx_eod_reports_code" ON "public"."end_of_day_reports" USING "btree" ("report_code");



CREATE INDEX "idx_eod_reports_date" ON "public"."end_of_day_reports" USING "btree" ("date");



CREATE INDEX "idx_eod_reports_staff" ON "public"."end_of_day_reports" USING "btree" ("staff_id");



CREATE INDEX "idx_grv_code" ON "public"."goods_receiving_vouchers" USING "btree" ("grv_code");



CREATE INDEX "idx_grv_date" ON "public"."goods_receiving_vouchers" USING "btree" ("date");



CREATE INDEX "idx_grv_status" ON "public"."goods_receiving_vouchers" USING "btree" ("status");



CREATE INDEX "idx_grv_stock_item" ON "public"."goods_receiving_vouchers" USING "btree" ("stock_item_id");



CREATE INDEX "idx_grv_supplier" ON "public"."goods_receiving_vouchers" USING "btree" ("supplier_id");



CREATE INDEX "idx_note_checklist_items_done" ON "public"."note_checklist_items" USING "btree" ("done");



CREATE INDEX "idx_note_checklist_items_note_id" ON "public"."note_checklist_items" USING "btree" ("note_id");



CREATE INDEX "idx_notes_color" ON "public"."notes" USING "btree" ("color");



CREATE INDEX "idx_notes_date" ON "public"."notes" USING "btree" ("date");



CREATE INDEX "idx_notes_done" ON "public"."notes" USING "btree" ("done");



CREATE INDEX "idx_notes_pinned" ON "public"."notes" USING "btree" ("pinned");



CREATE INDEX "idx_notes_user_id" ON "public"."notes" USING "btree" ("user_id");



CREATE INDEX "idx_po_items_po_id" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_price_history_item_name" ON "public"."price_history" USING "btree" ("item_name");



CREATE INDEX "idx_price_history_supplier_id" ON "public"."price_history" USING "btree" ("supplier_id");



CREATE INDEX "idx_purchase_orders_status" ON "public"."purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_purchase_orders_supplier_id" ON "public"."purchase_orders" USING "btree" ("supplier_id");



CREATE INDEX "idx_purchase_requests_auto_generated" ON "public"."purchase_requests" USING "btree" ("auto_generated");



CREATE INDEX "idx_purchase_requests_code" ON "public"."purchase_requests" USING "btree" ("pr_code");



CREATE INDEX "idx_purchase_requests_date" ON "public"."purchase_requests" USING "btree" ("date");



CREATE INDEX "idx_purchase_requests_grv_id" ON "public"."purchase_requests" USING "btree" ("grv_id");



CREATE INDEX "idx_purchase_requests_requested_by" ON "public"."purchase_requests" USING "btree" ("requested_by");



CREATE INDEX "idx_purchase_requests_status" ON "public"."purchase_requests" USING "btree" ("status");



CREATE INDEX "idx_purchase_requests_stock_item" ON "public"."purchase_requests" USING "btree" ("stock_item_id");



CREATE INDEX "idx_registrations_auth_user_id" ON "public"."registrations" USING "btree" ("auth_user_id");



CREATE INDEX "idx_registrations_date" ON "public"."registrations" USING "btree" ("registration_date");



CREATE INDEX "idx_registrations_email" ON "public"."registrations" USING "btree" ("email");



CREATE INDEX "idx_registrations_status" ON "public"."registrations" USING "btree" ("status");



CREATE INDEX "idx_siv_code" ON "public"."store_issue_vouchers" USING "btree" ("siv_code");



CREATE INDEX "idx_siv_date" ON "public"."store_issue_vouchers" USING "btree" ("date");



CREATE INDEX "idx_siv_staff_request" ON "public"."store_issue_vouchers" USING "btree" ("staff_request_id");



CREATE INDEX "idx_siv_status" ON "public"."store_issue_vouchers" USING "btree" ("status");



CREATE INDEX "idx_siv_stock_item" ON "public"."store_issue_vouchers" USING "btree" ("stock_item_id");



CREATE INDEX "idx_siv_type" ON "public"."store_issue_vouchers" USING "btree" ("type");



CREATE INDEX "idx_staff_requests_code" ON "public"."staff_requests" USING "btree" ("sr_code");



CREATE INDEX "idx_staff_requests_date" ON "public"."staff_requests" USING "btree" ("date");



CREATE INDEX "idx_staff_requests_staff" ON "public"."staff_requests" USING "btree" ("staff_id");



CREATE INDEX "idx_staff_requests_status" ON "public"."staff_requests" USING "btree" ("status");



CREATE INDEX "idx_staff_requests_type" ON "public"."staff_requests" USING "btree" ("request_type");



CREATE INDEX "idx_stock_items_balance" ON "public"."stock_items" USING "btree" ("balance");



CREATE INDEX "idx_stock_items_category" ON "public"."stock_items" USING "btree" ("category");



CREATE INDEX "idx_stock_items_code" ON "public"."stock_items" USING "btree" ("code");



CREATE INDEX "idx_stock_items_supplier" ON "public"."stock_items" USING "btree" ("supplier_id");



CREATE INDEX "idx_stock_movements_code" ON "public"."stock_movements" USING "btree" ("movement_code");



CREATE INDEX "idx_stock_movements_date" ON "public"."stock_movements" USING "btree" ("date");



CREATE INDEX "idx_stock_movements_reference" ON "public"."stock_movements" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_stock_movements_stock_item" ON "public"."stock_movements" USING "btree" ("stock_item_id");



CREATE INDEX "idx_stock_movements_type" ON "public"."stock_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_supplier_notifications_status" ON "public"."supplier_notifications" USING "btree" ("status");



CREATE INDEX "idx_supplier_notifications_supplier_id" ON "public"."supplier_notifications" USING "btree" ("supplier_id");



CREATE INDEX "idx_transport_costs_date" ON "public"."transport_costs" USING "btree" ("date");



CREATE INDEX "idx_transport_costs_item" ON "public"."transport_costs" USING "btree" ("item");



CREATE INDEX "idx_transport_costs_location" ON "public"."transport_costs" USING "btree" ("location");



CREATE INDEX "idx_user_notifications_created_at" ON "public"."user_notifications" USING "btree" ("created_at");



CREATE INDEX "idx_user_notifications_is_read" ON "public"."user_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_user_notifications_reference" ON "public"."user_notifications" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_user_notifications_type" ON "public"."user_notifications" USING "btree" ("type");



CREATE INDEX "idx_user_notifications_user" ON "public"."user_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_users_department" ON "public"."users" USING "btree" ("department_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_registration_date" ON "public"."users" USING "btree" ("registration_date");



CREATE INDEX "idx_users_registration_status" ON "public"."users" USING "btree" ("registration_status");



CREATE INDEX "idx_vendor_quote_items_item_id" ON "public"."vendor_quote_items" USING "btree" ("item_id");



CREATE INDEX "idx_vendor_quote_items_quote_id" ON "public"."vendor_quote_items" USING "btree" ("quote_id");



CREATE INDEX "idx_vendor_quotes_purchase_request_id" ON "public"."vendor_quotes" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_vendor_quotes_status" ON "public"."vendor_quotes" USING "btree" ("status");



CREATE INDEX "idx_vendor_quotes_vendor_id" ON "public"."vendor_quotes" USING "btree" ("vendor_id");



CREATE OR REPLACE TRIGGER "update_asset_transfers_updated_at" BEFORE UPDATE ON "public"."asset_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_messages_updated_at" BEFORE UPDATE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparison_items_updated_at" BEFORE UPDATE ON "public"."comparison_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparison_sessions_updated_at" BEFORE UPDATE ON "public"."comparison_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_credit_transactions_updated_at" BEFORE UPDATE ON "public"."credit_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_departments_updated_at" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_end_of_day_reports_updated_at" BEFORE UPDATE ON "public"."end_of_day_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_grv_updated_at" BEFORE UPDATE ON "public"."goods_receiving_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notes_updated_at_trigger" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_notes_updated_at"();



CREATE OR REPLACE TRIGGER "update_purchase_requests_updated_at" BEFORE UPDATE ON "public"."purchase_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_registrations_updated_at" BEFORE UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_siv_updated_at" BEFORE UPDATE ON "public"."store_issue_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_requests_updated_at" BEFORE UPDATE ON "public"."staff_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stock_items_updated_at" BEFORE UPDATE ON "public"."stock_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transport_costs_updated_at" BEFORE UPDATE ON "public"."transport_costs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vendor_quote_items_updated_at" BEFORE UPDATE ON "public"."vendor_quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vendor_quotes_updated_at" BEFORE UPDATE ON "public"."vendor_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."auction_items"
    ADD CONSTRAINT "auction_items_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auction_timeline"
    ADD CONSTRAINT "auction_timeline_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auction_timeline"
    ADD CONSTRAINT "auction_timeline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."auctions"
    ADD CONSTRAINT "auctions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."auctions"
    ADD CONSTRAINT "auctions_winning_supplier_id_fkey" FOREIGN KEY ("winning_supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bid_items"
    ADD CONSTRAINT "bid_items_auction_item_id_fkey" FOREIGN KEY ("auction_item_id") REFERENCES "public"."auction_items"("id");



ALTER TABLE ONLY "public"."bid_items"
    ADD CONSTRAINT "bid_items_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "public"."bids"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comparison_items"
    ADD CONSTRAINT "comparison_items_comparison_session_id_fkey" FOREIGN KEY ("comparison_session_id") REFERENCES "public"."comparison_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comparison_items"
    ADD CONSTRAINT "comparison_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."stock_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comparison_sessions"
    ADD CONSTRAINT "comparison_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comparison_sessions"
    ADD CONSTRAINT "comparison_sessions_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comparison_sessions"
    ADD CONSTRAINT "comparison_sessions_selected_vendor_id_fkey" FOREIGN KEY ("selected_vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."end_of_day_reports"
    ADD CONSTRAINT "end_of_day_reports_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."goods_receiving_vouchers"
    ADD CONSTRAINT "goods_receiving_vouchers_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."note_checklist_items"
    ADD CONSTRAINT "note_checklist_items_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "public"."bids"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_auction_item_id_fkey" FOREIGN KEY ("auction_item_id") REFERENCES "public"."auction_items"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_authorized_by_fkey" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_grv_id_fkey" FOREIGN KEY ("grv_id") REFERENCES "public"."goods_receiving_vouchers"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."staff_requests"
    ADD CONSTRAINT "staff_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."staff_requests"
    ADD CONSTRAINT "staff_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."staff_requests"
    ADD CONSTRAINT "staff_requests_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."staff_requests"
    ADD CONSTRAINT "staff_requests_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."store_issue_vouchers"
    ADD CONSTRAINT "store_issue_vouchers_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."store_issue_vouchers"
    ADD CONSTRAINT "store_issue_vouchers_staff_request_id_fkey" FOREIGN KEY ("staff_request_id") REFERENCES "public"."staff_requests"("id");



ALTER TABLE ONLY "public"."store_issue_vouchers"
    ADD CONSTRAINT "store_issue_vouchers_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."supplier_notifications"
    ADD CONSTRAINT "supplier_notifications_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id");



ALTER TABLE ONLY "public"."supplier_notifications"
    ADD CONSTRAINT "supplier_notifications_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id");



ALTER TABLE ONLY "public"."supplier_notifications"
    ADD CONSTRAINT "supplier_notifications_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."transport_costs"
    ADD CONSTRAINT "transport_costs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."vendor_quote_items"
    ADD CONSTRAINT "vendor_quote_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."stock_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_quote_items"
    ADD CONSTRAINT "vendor_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."vendor_quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_quotes"
    ADD CONSTRAINT "vendor_quotes_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_quotes"
    ADD CONSTRAINT "vendor_quotes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view all activities" ON "public"."activities" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to delete credit transactions" ON "public"."credit_transactions" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete transport costs" ON "public"."transport_costs" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert credit transactions" ON "public"."credit_transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert transport costs" ON "public"."transport_costs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read credit transactions" ON "public"."credit_transactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read transport costs" ON "public"."transport_costs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update credit transactions" ON "public"."credit_transactions" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update transport costs" ON "public"."transport_costs" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage chat messages" ON "public"."chat_messages" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage checklist items" ON "public"."note_checklist_items" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage conversation participants" ON "public"."conversation_participants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage conversations" ON "public"."conversations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage notes" ON "public"."notes" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage notifications" ON "public"."user_notifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage users" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create conversation participants" ON "public"."conversation_participants" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can create conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can create their own checklist items" ON "public"."note_checklist_items" FOR INSERT WITH CHECK (("note_id" IN ( SELECT "notes"."id"
   FROM "public"."notes"
  WHERE ("notes"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create their own notes" ON "public"."notes" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete comparison items" ON "public"."comparison_items" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can delete comparison sessions" ON "public"."comparison_sessions" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can delete their own checklist items" ON "public"."note_checklist_items" FOR DELETE USING (("note_id" IN ( SELECT "notes"."id"
   FROM "public"."notes"
  WHERE ("notes"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own notes" ON "public"."notes" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own notifications" ON "public"."user_notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete vendor quote items" ON "public"."vendor_quote_items" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can delete vendor quotes" ON "public"."vendor_quotes" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert comparison items" ON "public"."comparison_items" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert comparison sessions" ON "public"."comparison_sessions" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert own notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert vendor quote items" ON "public"."vendor_quote_items" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert vendor quotes" ON "public"."vendor_quotes" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can send messages in their conversations" ON "public"."chat_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update comparison items" ON "public"."comparison_items" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update comparison sessions" ON "public"."comparison_sessions" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own checklist items" ON "public"."note_checklist_items" FOR UPDATE USING (("note_id" IN ( SELECT "notes"."id"
   FROM "public"."notes"
  WHERE ("notes"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own messages" ON "public"."chat_messages" FOR UPDATE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notes" ON "public"."notes" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notifications" ON "public"."user_notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own participant status" ON "public"."conversation_participants" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update vendor quote items" ON "public"."vendor_quote_items" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update vendor quotes" ON "public"."vendor_quotes" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view all users" ON "public"."users" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view comparison items" ON "public"."comparison_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view comparison sessions" ON "public"."comparison_sessions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view conversation participants" ON "public"."conversation_participants" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view conversations they participate in" ON "public"."conversations" FOR SELECT USING (("id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view for foreign key validation" ON "public"."users" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view messages in their conversations" ON "public"."chat_messages" FOR SELECT USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own activities" ON "public"."activities" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own checklist items" ON "public"."note_checklist_items" FOR SELECT USING (("note_id" IN ( SELECT "notes"."id"
   FROM "public"."notes"
  WHERE ("notes"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own notes" ON "public"."notes" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own notifications" ON "public"."user_notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view vendor quote items" ON "public"."vendor_quote_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view vendor quotes" ON "public"."vendor_quotes" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comparison_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comparison_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transport_costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_quote_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_quotes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_registration"("registration_id" "uuid", "admin_user_id" "uuid", "assigned_role" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_registration"("registration_id" "uuid", "admin_user_id" "uuid", "assigned_role" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_registration"("registration_id" "uuid", "admin_user_id" "uuid", "assigned_role" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_from_email"("user_email" character varying, "user_role" character varying, "user_full_name" character varying, "user_department_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_from_email"("user_email" character varying, "user_role" character varying, "user_full_name" character varying, "user_department_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_from_email"("user_email" character varying, "user_role" character varying, "user_full_name" character varying, "user_department_code" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_notification"("target_user_id" "uuid", "notification_title" character varying, "notification_message" "text", "notification_type" character varying, "ref_type" character varying, "ref_id" "uuid", "ref_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_notification"("target_user_id" "uuid", "notification_title" character varying, "notification_message" "text", "notification_type" character varying, "ref_type" character varying, "ref_id" "uuid", "ref_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_notification"("target_user_id" "uuid", "notification_title" character varying, "notification_message" "text", "notification_type" character varying, "ref_type" character varying, "ref_id" "uuid", "ref_code" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_private_conversation"("user1_id" "uuid", "user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_private_conversation"("user1_id" "uuid", "user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_private_conversation"("user1_id" "uuid", "user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_stock_balance_with_alert"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_stock_balance_with_alert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stock_balance_with_alert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_messages_read"("user_id" "uuid", "conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_messages_read"("user_id" "uuid", "conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_messages_read"("user_id" "uuid", "conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_registration"("registration_id" "uuid", "admin_user_id" "uuid", "rejection_reason_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_registration"("registration_id" "uuid", "admin_user_id" "uuid", "rejection_reason_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_registration"("registration_id" "uuid", "admin_user_id" "uuid", "rejection_reason_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_after_grv"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_after_grv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_after_grv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_after_siv"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_after_siv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_after_siv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_settings_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."asset_transfers" TO "anon";
GRANT ALL ON TABLE "public"."asset_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."auction_items" TO "anon";
GRANT ALL ON TABLE "public"."auction_items" TO "authenticated";
GRANT ALL ON TABLE "public"."auction_items" TO "service_role";



GRANT ALL ON TABLE "public"."auction_timeline" TO "anon";
GRANT ALL ON TABLE "public"."auction_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."auction_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."auctions" TO "anon";
GRANT ALL ON TABLE "public"."auctions" TO "authenticated";
GRANT ALL ON TABLE "public"."auctions" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bid_items" TO "anon";
GRANT ALL ON TABLE "public"."bid_items" TO "authenticated";
GRANT ALL ON TABLE "public"."bid_items" TO "service_role";



GRANT ALL ON TABLE "public"."bids" TO "anon";
GRANT ALL ON TABLE "public"."bids" TO "authenticated";
GRANT ALL ON TABLE "public"."bids" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."comparison_items" TO "anon";
GRANT ALL ON TABLE "public"."comparison_items" TO "authenticated";
GRANT ALL ON TABLE "public"."comparison_items" TO "service_role";



GRANT ALL ON TABLE "public"."comparison_sessions" TO "anon";
GRANT ALL ON TABLE "public"."comparison_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."comparison_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."end_of_day_reports" TO "anon";
GRANT ALL ON TABLE "public"."end_of_day_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."end_of_day_reports" TO "service_role";



GRANT ALL ON TABLE "public"."goods_receiving_vouchers" TO "anon";
GRANT ALL ON TABLE "public"."goods_receiving_vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."goods_receiving_vouchers" TO "service_role";



GRANT ALL ON TABLE "public"."note_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."note_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."note_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."pending_registrations_view" TO "anon";
GRANT ALL ON TABLE "public"."pending_registrations_view" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_registrations_view" TO "service_role";



GRANT ALL ON TABLE "public"."price_history" TO "anon";
GRANT ALL ON TABLE "public"."price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."price_history" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requests" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requests" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."staff_requests" TO "anon";
GRANT ALL ON TABLE "public"."staff_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_requests" TO "service_role";



GRANT ALL ON TABLE "public"."stock_items" TO "anon";
GRANT ALL ON TABLE "public"."stock_items" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_items" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."store_issue_vouchers" TO "anon";
GRANT ALL ON TABLE "public"."store_issue_vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."store_issue_vouchers" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_notifications" TO "anon";
GRANT ALL ON TABLE "public"."supplier_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."transport_costs" TO "anon";
GRANT ALL ON TABLE "public"."transport_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."transport_costs" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "anon";
GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_quote_items" TO "anon";
GRANT ALL ON TABLE "public"."vendor_quote_items" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_quote_items" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_quotes" TO "anon";
GRANT ALL ON TABLE "public"."vendor_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_quotes" TO "service_role";



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







