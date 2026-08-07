


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



CREATE TYPE "public"."application_status_enum" AS ENUM (
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Offered',
    'Hired',
    'Rejected',
    'Withdrawn'
);


ALTER TYPE "public"."application_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."document_type_enum" AS ENUM (
    'department',
    'fixed_asset',
    'financial',
    'letter',
    'training'
);


ALTER TYPE "public"."document_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."employment_status_enum" AS ENUM (
    'Active',
    'Probation',
    'Terminated',
    'On Leave',
    'Resigned'
);


ALTER TYPE "public"."employment_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."field_visit_status_enum" AS ENUM (
    'In Progress',
    'Completed',
    'Cancelled'
);


ALTER TYPE "public"."field_visit_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."internship_status_enum" AS ENUM (
    'Pending',
    'Active',
    'Completed',
    'Cancelled'
);


ALTER TYPE "public"."internship_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."interview_decision_enum" AS ENUM (
    'Pending',
    'Strong Hire',
    'Hire',
    'No Hire',
    'On Hold'
);


ALTER TYPE "public"."interview_decision_enum" OWNER TO "postgres";


CREATE TYPE "public"."interview_status_enum" AS ENUM (
    'Scheduled',
    'Completed',
    'Cancelled',
    'Rescheduled',
    'No-Show'
);


ALTER TYPE "public"."interview_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."job_status_enum" AS ENUM (
    'Draft',
    'Published',
    'Closed',
    'Filled'
);


ALTER TYPE "public"."job_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."leave_type_enum" AS ENUM (
    'Annual',
    'Sick',
    'Casual',
    'Maternity',
    'Paternity',
    'Unpaid',
    'Study'
);


ALTER TYPE "public"."leave_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."request_status_enum" AS ENUM (
    'Pending',
    'Approved',
    'Rejected',
    'Withdrawn',
    'Cancelled'
);


ALTER TYPE "public"."request_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."training_provider_enum" AS ENUM (
    'Internal',
    'External'
);


ALTER TYPE "public"."training_provider_enum" OWNER TO "postgres";


CREATE TYPE "public"."training_status_enum" AS ENUM (
    'Planned',
    'In Progress',
    'Completed',
    'Cancelled',
    'Postponed'
);


ALTER TYPE "public"."training_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."training_type_enum" AS ENUM (
    'Technical',
    'Soft Skills',
    'Compliance',
    'Safety',
    'Leadership',
    'Onboarding',
    'Other'
);


ALTER TYPE "public"."training_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."upgrade_status_enum" AS ENUM (
    'Pending',
    'Under Review',
    'Approved',
    'Rejected',
    'Completed',
    'Cancelled'
);


ALTER TYPE "public"."upgrade_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."upgrade_type_enum" AS ENUM (
    'Degree',
    'Certification',
    'License',
    'Training',
    'Conference',
    'Other'
);


ALTER TYPE "public"."upgrade_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'hr',
    'employee'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."audit_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_link_user_to_employee"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If employee_id is not set and email matches an employee, link them
  IF NEW.employee_id IS NULL THEN
    NEW.employee_id := (
      SELECT id 
      FROM employees 
      WHERE email = NEW.email 
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_link_user_to_employee"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_link_user_to_employee"() IS 'Automatically links users to employee records based on matching email addresses';



CREATE OR REPLACE FUNCTION "public"."calculate_overtime_from_attendance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    overtime_rule RECORD;
    v_scheduled_hours NUMERIC;
    v_actual_hours NUMERIC;
    v_overtime_hours NUMERIC;
    v_hourly_rate NUMERIC;
    v_overtime_multiplier NUMERIC;
    v_overtime_amount NUMERIC;
    v_day_type TEXT;
    v_work_date DATE;
    employee_record RECORD;
    pre_approval_request RECORD;
    v_require_pre_approval BOOLEAN;
BEGIN
    -- Only calculate on complete attendance records (both clock in and clock out)
    IF NEW.clock_out_time IS NULL OR NEW.clock_in_time IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get active overtime rule
    SELECT * INTO overtime_rule 
    FROM overtime_rules 
    WHERE is_active = true 
    AND effective_from <= NEW.date 
    AND (effective_to IS NULL OR effective_to >= NEW.date)
    ORDER BY effective_from DESC 
    LIMIT 1;
    
    -- If no rule found, use defaults
    IF NOT FOUND THEN
        v_scheduled_hours := 8.0;
        v_overtime_multiplier := 1.5;
        v_day_type := 'weekday';
        v_require_pre_approval := false;
    ELSE
        v_scheduled_hours := overtime_rule.standard_hours_per_day;
        v_overtime_multiplier := overtime_rule.weekday_multiplier;
        v_day_type := 'weekday';
        v_require_pre_approval := COALESCE(overtime_rule.require_pre_approval, false);
    END IF;
    
    -- Check if pre-approval is required
    IF v_require_pre_approval THEN
        -- Check for approved pre-approval request
        SELECT * INTO pre_approval_request
        FROM overtime_requests
        WHERE employee_id = NEW.employee_id
        AND request_date = NEW.date
        AND request_type = 'pre_approved'
        AND status = 'Approved'
        LIMIT 1;
        
        -- If no approved pre-approval found, skip overtime calculation
        IF NOT FOUND THEN
            -- Insert or update overtime record with zero overtime
            INSERT INTO overtime_records (
                employee_id,
                attendance_id,
                work_date,
                check_in_time,
                check_out_time,
                scheduled_hours,
                actual_hours,
                overtime_hours,
                hourly_rate,
                overtime_multiplier,
                overtime_amount,
                day_type,
                status
            ) VALUES (
                NEW.employee_id,
                NEW.id,
                NEW.date,
                NEW.clock_in_time,
                NEW.clock_out_time,
                v_scheduled_hours,
                EXTRACT(EPOCH FROM (NEW.clock_out_time - NEW.clock_in_time)) / 3600,
                0,
                0,
                1,
                0,
                v_day_type,
                'Processed'
            )
            ON CONFLICT (employee_id, work_date) DO UPDATE SET
                attendance_id = NEW.id,
                check_in_time = NEW.clock_in_time,
                check_out_time = NEW.clock_out_time,
                actual_hours = EXTRACT(EPOCH FROM (NEW.clock_out_time - NEW.clock_in_time)) / 3600,
                overtime_hours = 0,
                overtime_amount = 0,
                status = 'Processed',
                updated_at = NOW();
            
            RETURN NEW;
        END IF;
    END IF;
    
    -- Calculate actual hours worked
    v_actual_hours := EXTRACT(EPOCH FROM (NEW.clock_out_time - NEW.clock_in_time)) / 3600;
    
    -- Determine day type (weekend check)
    IF EXTRACT(DOW FROM NEW.date) IN (0, 6) THEN
        v_day_type := 'weekend';
        IF overtime_rule IS NOT NULL THEN
            v_overtime_multiplier := overtime_rule.weekend_multiplier;
        ELSE
            v_overtime_multiplier := 2.0;
        END IF;
    END IF;
    
    -- Calculate overtime hours
    v_overtime_hours := 0;
    IF v_actual_hours > v_scheduled_hours THEN
        v_overtime_hours := v_actual_hours - v_scheduled_hours;
        
        -- Apply minimum threshold
        IF overtime_rule IS NOT NULL AND overtime_rule.minimum_overtime_minutes > 0 THEN
            IF (v_overtime_hours * 60) < overtime_rule.minimum_overtime_minutes THEN
                v_overtime_hours := 0;
            END IF;
        END IF;
        
        -- Apply rounding
        IF overtime_rule IS NOT NULL AND overtime_rule.rounding_minutes > 0 AND v_overtime_hours > 0 THEN
            v_overtime_hours := ROUND((v_overtime_hours * 60) / overtime_rule.rounding_minutes) * overtime_rule.rounding_minutes / 60;
        END IF;
    END IF;
    
    -- Get employee salary for hourly rate calculation
    SELECT salary INTO employee_record
    FROM employees
    WHERE id = NEW.employee_id;
    
    -- Calculate hourly rate (assuming 22 working days per month)
    IF employee_record.salary IS NOT NULL THEN
        v_hourly_rate := employee_record.salary / 22 / v_scheduled_hours;
    ELSE
        v_hourly_rate := 0;
    END IF;
    
    -- Calculate overtime amount
    v_overtime_amount := v_overtime_hours * v_hourly_rate * v_overtime_multiplier;
    
    -- Insert or update overtime record
    INSERT INTO overtime_records (
        employee_id,
        attendance_id,
        work_date,
        check_in_time,
        check_out_time,
        scheduled_hours,
        actual_hours,
        overtime_hours,
        hourly_rate,
        overtime_multiplier,
        overtime_amount,
        day_type,
        status
    ) VALUES (
        NEW.employee_id,
        NEW.id,
        NEW.date,
        NEW.clock_in_time,
        NEW.clock_out_time,
        v_scheduled_hours,
        v_actual_hours,
        v_overtime_hours,
        v_hourly_rate,
        v_overtime_multiplier,
        v_overtime_amount,
        v_day_type,
        CASE WHEN v_overtime_hours > 0 THEN 'Pending' ELSE 'Processed' END
    )
    ON CONFLICT (employee_id, work_date) DO UPDATE SET
        attendance_id = NEW.id,
        check_in_time = NEW.clock_in_time,
        check_out_time = NEW.clock_out_time,
        actual_hours = v_actual_hours,
        overtime_hours = v_overtime_hours,
        hourly_rate = v_hourly_rate,
        overtime_multiplier = v_overtime_multiplier,
        overtime_amount = v_overtime_amount,
        day_type = v_day_type,
        status = CASE WHEN v_overtime_hours > 0 THEN 'Pending' ELSE 'Processed' END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_overtime_from_attendance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_work_hours"("clock_in" timestamp with time zone, "clock_out" timestamp with time zone) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF clock_out IS NULL THEN
    RETURN 0;
  END IF;
  RETURN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600;
END;
$$;


ALTER FUNCTION "public"."calculate_work_hours"("clock_in" timestamp with time zone, "clock_out" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_employee_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text" DEFAULT 'info'::"text", "p_related_entity_type" "text" DEFAULT NULL::"text", "p_related_entity_id" "uuid" DEFAULT NULL::"uuid", "p_action_url" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        employee_id,
        title,
        message,
        type,
        category,
        related_entity_type,
        related_entity_id,
        action_url
    ) VALUES (
        p_user_id,
        p_employee_id,
        p_title,
        p_message,
        p_type,
        p_category,
        p_related_entity_type,
        p_related_entity_id,
        p_action_url
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_employee_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."determine_attendance_status"("clock_in_time" timestamp with time zone, "work_start_time" time without time zone, "grace_period_minutes" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  work_start TIMESTAMP WITH TIME ZONE;
  grace_limit TIMESTAMP WITH TIME ZONE;
BEGIN
  work_start = clock_in_time::DATE + work_start_time;
  grace_limit = work_start + (grace_period_minutes || ' minutes')::INTERVAL;
  
  IF clock_in_time <= grace_limit THEN
    RETURN 'present';
  ELSIF clock_in_time <= work_start + INTERVAL '1 hour' THEN
    RETURN 'late';
  ELSIF clock_in_time <= work_start + INTERVAL '4 hours' THEN
    RETURN 'half_day';
  ELSE
    RETURN 'absent';
  END IF;
END;
$$;


ALTER FUNCTION "public"."determine_attendance_status"("clock_in_time" timestamp with time zone, "work_start_time" time without time zone, "grace_period_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation"("user1_id" "uuid", "user2_id" "uuid") RETURNS TABLE("id" "uuid", "sender_id" "uuid", "receiver_id" "uuid", "message" "text", "is_read" boolean, "created_at" timestamp with time zone, "sender_name" "text", "receiver_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.sender_id,
        cm.receiver_id,
        cm.message,
        cm.is_read,
        cm.created_at,
        u1.full_name as sender_name,
        u2.full_name as receiver_name
    FROM chat_messages cm
    JOIN users u1 ON cm.sender_id = u1.id
    JOIN users u2 ON cm.receiver_id = u2.id
    WHERE 
        (cm.sender_id = user1_id AND cm.receiver_id = user2_id) OR
        (cm.sender_id = user2_id AND cm.receiver_id = user1_id)
    ORDER BY cm.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_conversation"("user1_id" "uuid", "user2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_department_overtime_summary"("p_department" "text", "p_year" integer DEFAULT NULL::integer, "p_month" integer DEFAULT NULL::integer) RETURNS TABLE("total_employees" integer, "total_overtime_hours" numeric, "total_overtime_amount" numeric, "avg_overtime_hours" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT o.employee_id) as total_employees,
        COALESCE(SUM(o.overtime_hours), 0) as total_overtime_hours,
        COALESCE(SUM(o.overtime_amount), 0) as total_overtime_amount,
        COALESCE(AVG(o.overtime_hours), 0) as avg_overtime_hours
    FROM overtime_records o
    JOIN employees e ON o.employee_id = e.id
    WHERE e.department = p_department
    AND (p_year IS NULL OR EXTRACT(YEAR FROM o.work_date) = p_year)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM o.work_date) = p_month);
END;
$$;


ALTER FUNCTION "public"."get_department_overtime_summary"("p_department" "text", "p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT employee_id FROM users WHERE id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."get_employee_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_overtime_summary"("p_employee_id" "uuid", "p_year" integer DEFAULT NULL::integer, "p_month" integer DEFAULT NULL::integer) RETURNS TABLE("total_overtime_hours" numeric, "total_overtime_amount" numeric, "pending_count" integer, "approved_count" integer, "rejected_count" integer, "processed_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(overtime_hours), 0) as total_overtime_hours,
        COALESCE(SUM(overtime_amount), 0) as total_overtime_amount,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'Approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'Processed') as processed_count
    FROM overtime_records
    WHERE employee_id = p_employee_id
    AND (p_year IS NULL OR EXTRACT(YEAR FROM work_date) = p_year)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM work_date) = p_month);
END;
$$;


ALTER FUNCTION "public"."get_employee_overtime_summary"("p_employee_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("user_id" "uuid") RETURNS TABLE("other_user_id" "uuid", "other_user_name" "text", "other_user_email" "text", "last_message" "text", "last_message_time" timestamp with time zone, "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH conversations AS (
        SELECT 
            CASE 
                WHEN sender_id = user_id THEN receiver_id 
                ELSE sender_id 
            END as other_user_id,
            MAX(created_at) as last_message_time
        FROM chat_messages
        WHERE sender_id = user_id OR receiver_id = user_id
        GROUP BY 
            CASE 
                WHEN sender_id = user_id THEN receiver_id 
                ELSE sender_id 
            END
    )
    SELECT 
        c.other_user_id,
        u.full_name as other_user_name,
        u.email as other_user_email,
        (
            SELECT message 
            FROM chat_messages 
            WHERE 
                (sender_id = user_id AND receiver_id = c.other_user_id) OR
                (sender_id = c.other_user_id AND receiver_id = user_id)
            ORDER BY created_at DESC 
            LIMIT 1
        ) as last_message,
        c.last_message_time,
        (
            SELECT COUNT(*) 
            FROM chat_messages 
            WHERE 
                sender_id = c.other_user_id AND 
                receiver_id = user_id AND 
                is_read = FALSE
        ) as unread_count
    FROM conversations c
    JOIN users u ON c.other_user_id = u.id
    ORDER BY c.last_message_time DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_hr"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'hr'
  );
END;
$$;


ALTER FUNCTION "public"."is_hr"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_within_office_distance"("employee_lat" numeric, "employee_lng" numeric, "office_lat" numeric, "office_lng" numeric, "max_distance_meters" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  distance_meters DECIMAL;
BEGIN
  distance_meters = 6371000 * ACOS(
    COS(RADIANS(employee_lat)) * COS(RADIANS(office_lat)) *
    COS(RADIANS(office_lng) - RADIANS(employee_lng)) +
    SIN(RADIANS(employee_lat)) * SIN(RADIANS(office_lat))
  );
  
  RETURN distance_meters <= max_distance_meters;
END;
$$;


ALTER FUNCTION "public"."is_within_office_distance"("employee_lat" numeric, "employee_lng" numeric, "office_lat" numeric, "office_lng" numeric, "max_distance_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read_status = true, read_at = NOW()
    WHERE user_id = p_user_id AND read_status = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_messages_as_read"("sender_id_param" "uuid", "receiver_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE chat_messages
    SET is_read = TRUE, updated_at = NOW()
    WHERE 
        sender_id = sender_id_param AND 
        receiver_id = receiver_id_param AND 
        is_read = FALSE;
END;
$$;


ALTER FUNCTION "public"."mark_messages_as_read"("sender_id_param" "uuid", "receiver_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE notifications 
    SET read_status = true, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_all_hrs"("p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text" DEFAULT 'info'::"text", "p_related_entity_type" "text" DEFAULT NULL::"text", "p_related_entity_id" "uuid" DEFAULT NULL::"uuid", "p_action_url" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_count INTEGER := 0;
    hr_user RECORD;
BEGIN
    FOR hr_user IN 
        SELECT u.id, u.employee_id 
        FROM users u
        WHERE u.role = 'hr' AND u.is_active = true
    LOOP
        PERFORM create_notification(
            hr_user.id,
            hr_user.employee_id,
            p_title,
            p_message,
            p_type,
            p_category,
            p_related_entity_type,
            p_related_entity_id,
            p_action_url
        );
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."notify_all_hrs"("p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_hr_new_job_application"("p_job_application_id" "uuid", "p_job_title" "text", "p_applicant_name" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN notify_all_hrs(
        'New Job Application',
        p_applicant_name || ' has applied for ' || p_job_title || '.',
        'job',
        'info',
        'job_application',
        p_job_application_id,
        '/recruitment/applications'
    );
END;
$$;


ALTER FUNCTION "public"."notify_hr_new_job_application"("p_job_application_id" "uuid", "p_job_title" "text", "p_applicant_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_hr_new_leave_request"("p_leave_request_id" "uuid", "p_employee_name" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN notify_all_hrs(
        'New Leave Request',
        p_employee_name || ' has submitted a new leave request.',
        'leave',
        'info',
        'leave_request',
        p_leave_request_id,
        '/leave/requests'
    );
END;
$$;


ALTER FUNCTION "public"."notify_hr_new_leave_request"("p_leave_request_id" "uuid", "p_employee_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_hr_new_overtime_request"("p_overtime_request_id" "uuid", "p_employee_name" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN notify_all_hrs(
        'New Overtime Request',
        p_employee_name || ' has submitted a new overtime request.',
        'overtime',
        'info',
        'overtime_request',
        p_overtime_request_id,
        '/overtime/requests'
    );
END;
$$;


ALTER FUNCTION "public"."notify_hr_new_overtime_request"("p_overtime_request_id" "uuid", "p_employee_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_hr_new_upgrade_request"("p_upgrade_request_id" "uuid", "p_employee_name" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN notify_all_hrs(
        'New Upgrade Request',
        p_employee_name || ' has submitted a new professional upgrade request.',
        'upgrade',
        'info',
        'professional_upgrade_request',
        p_upgrade_request_id,
        '/career/upgrades'
    );
END;
$$;


ALTER FUNCTION "public"."notify_hr_new_upgrade_request"("p_upgrade_request_id" "uuid", "p_employee_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_interview_scheduled"("p_employee_id" "uuid", "p_user_id" "uuid", "p_interview_id" "uuid", "p_job_title" "text", "p_interview_date" timestamp without time zone) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_message TEXT;
BEGIN
    v_message := 'Your interview for ' || p_job_title || ' is scheduled for ' || to_char(p_interview_date, 'YYYY-MM-DD HH:MI') || '.';
    
    RETURN create_notification(
        p_user_id,
        p_employee_id,
        'Interview Scheduled',
        v_message,
        'interview',
        'success',
        'interview',
        p_interview_id,
        '/recruitment/interviews'
    );
END;
$$;


ALTER FUNCTION "public"."notify_interview_scheduled"("p_employee_id" "uuid", "p_user_id" "uuid", "p_interview_id" "uuid", "p_job_title" "text", "p_interview_date" timestamp without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_job_application_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_job_application_id" "uuid", "p_job_title" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_category TEXT;
BEGIN
    CASE p_status
        WHEN 'Hired' THEN
            v_title := 'Congratulations! You Have Been Hired';
            v_message := 'Your application for ' || p_job_title || ' has been successful. Welcome to the team!';
            v_category := 'success';
        WHEN 'Offered' THEN
            v_title := 'Job Offer Received';
            v_message := 'You have received a job offer for ' || p_job_title || '.';
            v_category := 'success';
        WHEN 'Interview Scheduled' THEN
            v_title := 'Interview Scheduled';
            v_message := 'Your interview for ' || p_job_title || ' has been scheduled.';
            v_category := 'info';
        WHEN 'Under Review' THEN
            v_title := 'Application Under Review';
            v_message := 'Your application for ' || p_job_title || ' is under review.';
            v_category := 'info';
        WHEN 'Rejected' THEN
            v_title := 'Application Not Successful';
            v_message := 'Your application for ' || p_job_title || ' was not successful.';
            v_category := 'error';
        ELSE
            v_title := 'Application Status Updated';
            v_message := 'Your application status for ' || p_job_title || ' has been updated.';
            v_category := 'info';
    END CASE;
    
    RETURN create_notification(
        p_user_id,
        p_employee_id,
        v_title,
        v_message,
        'job',
        v_category,
        'job_application',
        p_job_application_id,
        '/recruitment/applications'
    );
END;
$$;


ALTER FUNCTION "public"."notify_job_application_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_job_application_id" "uuid", "p_job_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_leave_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_leave_request_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_category TEXT;
BEGIN
    CASE p_status
        WHEN 'Approved' THEN
            v_title := 'Leave Request Approved';
            v_message := 'Your leave request has been approved by HR.';
            v_category := 'success';
        WHEN 'Rejected' THEN
            v_title := 'Leave Request Rejected';
            v_message := 'Your leave request has been rejected by HR.';
            v_category := 'error';
        WHEN 'Pending' THEN
            v_title := 'Leave Request Submitted';
            v_message := 'Your leave request has been submitted and is pending HR approval.';
            v_category := 'info';
        ELSE
            v_title := 'Leave Request Updated';
            v_message := 'Your leave request status has been updated.';
            v_category := 'info';
    END CASE;
    
    RETURN create_notification(
        p_user_id,
        p_employee_id,
        v_title,
        v_message,
        'leave',
        v_category,
        'leave_request',
        p_leave_request_id,
        '/leave/requests'
    );
END;
$$;


ALTER FUNCTION "public"."notify_leave_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_leave_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_overtime_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_overtime_request_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_category TEXT;
BEGIN
    CASE p_status
        WHEN 'Approved' THEN
            v_title := 'Overtime Request Approved';
            v_message := 'Your overtime request has been approved by HR.';
            v_category := 'success';
        WHEN 'Rejected' THEN
            v_title := 'Overtime Request Rejected';
            v_message := 'Your overtime request has been rejected by HR.';
            v_category := 'error';
        WHEN 'Pending' THEN
            v_title := 'Overtime Request Submitted';
            v_message := 'Your overtime request has been submitted and is pending HR approval.';
            v_category := 'info';
        ELSE
            v_title := 'Overtime Request Updated';
            v_message := 'Your overtime request status has been updated.';
            v_category := 'info';
    END CASE;
    
    RETURN create_notification(
        p_user_id,
        p_employee_id,
        v_title,
        v_message,
        'overtime',
        v_category,
        'overtime_request',
        p_overtime_request_id,
        '/overtime/requests'
    );
END;
$$;


ALTER FUNCTION "public"."notify_overtime_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_overtime_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_upgrade_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_upgrade_request_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_category TEXT;
BEGIN
    CASE p_status
        WHEN 'Approved' THEN
            v_title := 'Upgrade Request Approved';
            v_message := 'Your professional upgrade request has been approved by HR.';
            v_category := 'success';
        WHEN 'Rejected' THEN
            v_title := 'Upgrade Request Rejected';
            v_message := 'Your professional upgrade request has been rejected by HR.';
            v_category := 'error';
        WHEN 'Pending' THEN
            v_title := 'Upgrade Request Submitted';
            v_message := 'Your professional upgrade request has been submitted and is pending HR approval.';
            v_category := 'info';
        ELSE
            v_title := 'Upgrade Request Updated';
            v_message := 'Your upgrade request status has been updated.';
            v_category := 'info';
    END CASE;
    
    RETURN create_notification(
        p_user_id,
        p_employee_id,
        v_title,
        v_message,
        'upgrade',
        v_category,
        'professional_upgrade_request',
        p_upgrade_request_id,
        '/career/upgrades'
    );
END;
$$;


ALTER FUNCTION "public"."notify_upgrade_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_upgrade_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_field_visits_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_field_visits_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_internships_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_internships_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leave_balance"("p_employee_id" "uuid", "p_leave_type" "text", "p_days" numeric, "p_year" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  balance_record record;
BEGIN
  -- Check if balance record exists for this employee and year
  SELECT * INTO balance_record
  FROM leave_balances
  WHERE employee_id = p_employee_id AND leave_year = p_year;
  
  IF NOT FOUND THEN
    -- Create new balance record if it doesn't exist
    INSERT INTO leave_balances (
      employee_id,
      leave_year,
      annual_entitlement,
      sick_entitlement,
      casual_entitlement,
      study_entitlement,
      carried_forward,
      total_used,
      remaining_annual,
      remaining_sick,
      remaining_casual,
      remaining_study
    ) VALUES (
      p_employee_id,
      p_year,
      20,
      10,
      5,
      5,
      0,
      0,
      20,
      10,
      5,
      5
    );
  END IF;
  
  -- Update the appropriate balance based on leave type
  IF p_leave_type = 'annual' THEN
    UPDATE leave_balances
    SET 
      total_used = total_used + p_days,
      remaining_annual = GREATEST(0, remaining_annual - p_days)
    WHERE employee_id = p_employee_id AND leave_year = p_year;
  ELSIF p_leave_type = 'sick' THEN
    UPDATE leave_balances
    SET 
      total_used = total_used + p_days,
      remaining_sick = GREATEST(0, remaining_sick - p_days)
    WHERE employee_id = p_employee_id AND leave_year = p_year;
  ELSIF p_leave_type = 'casual' THEN
    UPDATE leave_balances
    SET 
      total_used = total_used + p_days,
      remaining_casual = GREATEST(0, remaining_casual - p_days)
    WHERE employee_id = p_employee_id AND leave_year = p_year;
  ELSIF p_leave_type = 'study' THEN
    UPDATE leave_balances
    SET 
      total_used = total_used + p_days,
      remaining_study = GREATEST(0, remaining_study - p_days)
    WHERE employee_id = p_employee_id AND leave_year = p_year;
  ELSIF p_leave_type = 'maternity' OR p_leave_type = 'paternity' THEN
    UPDATE leave_balances
    SET total_used = total_used + p_days
    WHERE employee_id = p_employee_id AND leave_year = p_year;
  ELSIF p_leave_type = 'unpaid' THEN
    UPDATE leave_balances
    SET total_used = total_used + p_days
    WHERE employee_id = p_employee_id AND leave_year = p_year;
  END IF;
  
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating leave balance: %', SQLERRM;
    RETURN false;
END;
$$;


ALTER FUNCTION "public"."update_leave_balance"("p_employee_id" "uuid", "p_leave_type" "text", "p_days" numeric, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trainings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trainings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "clock_in_time" timestamp with time zone NOT NULL,
    "clock_out_time" timestamp with time zone,
    "clock_in_location_lat" numeric(10,8),
    "clock_in_location_lng" numeric(11,8),
    "clock_out_location_lat" numeric(10,8),
    "clock_out_location_lng" numeric(11,8),
    "clock_in_selfie_url" "text",
    "clock_out_selfie_url" "text",
    "clock_in_device_info" "jsonb",
    "clock_out_device_info" "jsonb",
    "clock_in_ip_address" "inet",
    "clock_out_ip_address" "inet",
    "status" "text" DEFAULT 'present'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendance_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'absent'::"text", 'late'::"text", 'half_day'::"text", 'early_departure'::"text"])))
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_start_time" time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    "work_end_time" time without time zone DEFAULT '17:00:00'::time without time zone NOT NULL,
    "grace_period_minutes" integer DEFAULT 15,
    "require_selfie" boolean DEFAULT true,
    "require_location" boolean DEFAULT true,
    "max_distance_meters" integer DEFAULT 500,
    "auto_clock_out" boolean DEFAULT false,
    "auto_clock_out_time" time without time zone DEFAULT '18:00:00'::time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "late_threshold_minutes" integer DEFAULT 60,
    "half_day_threshold_minutes" integer DEFAULT 240,
    "absent_threshold_minutes" integer DEFAULT 240
);


ALTER TABLE "public"."attendance_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearance_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clearance_request_id" "uuid" NOT NULL,
    "approval_level" "text" NOT NULL,
    "approved_by" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "comments" "text",
    "approved_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clearance_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearance_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clearance_request_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "uploader_role" "text" NOT NULL,
    "document_name" "text" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_comment" "text",
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clearance_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "reason_for_leaving" "text" NOT NULL,
    "last_working_date" "date" NOT NULL,
    "additional_comments" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "in_progress_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "completed_by" "uuid",
    "hr_comments" "text",
    "rejection_reason" "text",
    "certificate_generated" boolean DEFAULT false,
    "certificate_url" "text",
    "certificate_generated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."clearance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearance_task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_name" "text" NOT NULL,
    "task_description" "text",
    "assigned_to" "text" DEFAULT 'employee'::"text",
    "task_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clearance_task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clearance_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clearance_request_id" "uuid" NOT NULL,
    "task_name" "text" NOT NULL,
    "task_description" "text",
    "task_order" integer DEFAULT 0,
    "assigned_to" "text" DEFAULT 'employee'::"text",
    "status" "text" DEFAULT 'Pending'::"text",
    "completed_by" "uuid",
    "completed_at" timestamp with time zone,
    "completion_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."clearance_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_content" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "department" "text",
    "job_title" "text",
    "employment_status" "public"."employment_status_enum" DEFAULT 'Active'::"public"."employment_status_enum" NOT NULL,
    "join_date" "date",
    "current_education_level" "text",
    "current_degree" "text",
    "university" "text",
    "graduation_year" integer,
    "profile_image" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "role" "text" DEFAULT 'employee'::"text",
    "first_name" "text",
    "last_name" "text",
    "gender" "text",
    "date_of_birth" "date",
    "nationality" "text",
    "marital_status" "text",
    "blood_group" "text",
    "religion" "text",
    "address" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "emergency_contact_relationship" "text",
    "personal_email" "text",
    "alternate_phone" "text",
    "home_address" "text",
    "city" "text",
    "state" "text",
    "country" "text",
    "postal_code" "text",
    "position" "text",
    "employment_type" "text",
    "manager_id" "uuid",
    "probation_end_date" "date",
    "salary" numeric,
    "work_location" "text",
    "shift" "text",
    "reporting_manager" "text",
    "promotion_history" "jsonb" DEFAULT '[]'::"jsonb",
    "bank_name" "text",
    "account_holder" "text",
    "account_number" "text",
    "branch" "text",
    "swift_code" "text",
    "iban" "text",
    "payment_method" "text",
    "tax_number" "text",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "national_id" "text",
    "passport_number" "text",
    "passport_expiry_date" "date",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "warranty_full_name" "text",
    "warranty_phone" "text",
    "warranty_fayda_number" "text",
    "warranty_relationship" "text"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


COMMENT ON COLUMN "public"."employees"."promotion_history" IS 'Array of promotion history objects with structure: [{date, from_position, to_position, reason}]';



COMMENT ON COLUMN "public"."employees"."documents" IS 'Employee documents stored as JSONB array of objects with structure: [{name, type, note, url, upload_date}] where type can be: department, fixed_asset, financial, letter, training';



COMMENT ON COLUMN "public"."employees"."warranty_full_name" IS 'Full name of the warranty/guarantor person';



COMMENT ON COLUMN "public"."employees"."warranty_phone" IS 'Phone number of the warranty/guarantor person';



COMMENT ON COLUMN "public"."employees"."warranty_fayda_number" IS 'Fayda number (ID number) of the warranty/guarantor person';



COMMENT ON COLUMN "public"."employees"."warranty_relationship" IS 'Relationship of the warranty/guarantor person to the employee';



CREATE TABLE IF NOT EXISTS "public"."field_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "sitename" "text" NOT NULL,
    "contact" "text" NOT NULL,
    "purpose" "text" NOT NULL,
    "location" "text" NOT NULL,
    "note" "text",
    "visit_date" "date" NOT NULL,
    "visit_time" time without time zone NOT NULL,
    "status" "public"."field_visit_status_enum" DEFAULT 'In Progress'::"public"."field_visit_status_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "documents" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."field_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "color" "text" DEFAULT 'blue'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hr_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_number" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "date_of_birth" "date",
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "address" "text",
    "emergency_contact" "text",
    "university" "text" NOT NULL,
    "faculty" "text",
    "department_of_study" "text" NOT NULL,
    "year_of_study" "text",
    "student_id" "text",
    "internship_position" "text" NOT NULL,
    "assigned_department" "text",
    "supervisor_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "working_schedule" "text",
    "status" "public"."internship_status_enum" DEFAULT 'Pending'::"public"."internship_status_enum" NOT NULL,
    "application_letter_url" "text",
    "recommendation_letter_url" "text",
    "cv_url" "text",
    "id_card_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "scheduled_by" "uuid",
    "interview_date" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "interview_type" "text",
    "location" "text",
    "meeting_link" "text",
    "status" "public"."interview_status_enum" DEFAULT 'Scheduled'::"public"."interview_status_enum",
    "feedback" "text",
    "rating" integer,
    "decision" "public"."interview_decision_enum",
    "notes" "text",
    "email_sent_at" timestamp with time zone,
    "reminder_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interviewer_name" "text",
    "interviewer_email" "text"
);


ALTER TABLE "public"."interviews" OWNER TO "postgres";


COMMENT ON COLUMN "public"."interviews"."interviewer_name" IS 'Name of the person conducting the interview';



COMMENT ON COLUMN "public"."interviews"."interviewer_email" IS 'Email of the interviewer for coordination';



CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "applicant_id" "uuid" NOT NULL,
    "cover_letter" "text",
    "resume_url" "jsonb" DEFAULT '[]'::"jsonb",
    "additional_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "public"."application_status_enum" DEFAULT 'Applied'::"public"."application_status_enum",
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "portfolio_url" "text",
    "linkedin_url" "text"
);


ALTER TABLE "public"."job_applications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."job_applications"."resume_url" IS 'Resume/CV documents stored as JSONB array of objects with name and url (base64 data)';



COMMENT ON COLUMN "public"."job_applications"."full_name" IS 'Applicant full name provided during application';



COMMENT ON COLUMN "public"."job_applications"."email" IS 'Applicant email provided during application';



COMMENT ON COLUMN "public"."job_applications"."phone" IS 'Applicant phone number provided during application';



COMMENT ON COLUMN "public"."job_applications"."portfolio_url" IS 'Optional portfolio URL';



COMMENT ON COLUMN "public"."job_applications"."linkedin_url" IS 'Optional LinkedIn profile URL';



CREATE TABLE IF NOT EXISTS "public"."job_postings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "requirements" "text",
    "qualifications" "text",
    "location" "text",
    "employment_type" "text",
    "salary_range" "text",
    "posted_by" "uuid",
    "status" "public"."job_status_enum" DEFAULT 'Draft'::"public"."job_status_enum",
    "application_deadline" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_postings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_year" integer NOT NULL,
    "annual_entitlement" numeric DEFAULT 0,
    "sick_entitlement" numeric DEFAULT 0,
    "casual_entitlement" numeric DEFAULT 0,
    "study_entitlement" numeric DEFAULT 0,
    "carried_forward" numeric DEFAULT 0,
    "total_used" numeric DEFAULT 0,
    "remaining_annual" numeric DEFAULT 0,
    "remaining_sick" numeric DEFAULT 0,
    "remaining_casual" numeric DEFAULT 0,
    "remaining_study" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leave_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type" "public"."leave_type_enum" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "total_days" numeric NOT NULL,
    "reason" "text",
    "status" "public"."request_status_enum" DEFAULT 'Pending'::"public"."request_status_enum",
    "hr_comment" "text",
    "action_date" "date",
    "action_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text",
    "type" "text",
    "category" "text",
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "action_url" "text",
    "read_status" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'System notifications for users about HR events and updates';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Type of notification: leave, overtime, upgrade, job, interview, system';



COMMENT ON COLUMN "public"."notifications"."category" IS 'Category for UI styling: info, success, warning, error';



COMMENT ON COLUMN "public"."notifications"."related_entity_type" IS 'Type of entity the notification refers to';



COMMENT ON COLUMN "public"."notifications"."related_entity_id" IS 'ID of the related entity';



COMMENT ON COLUMN "public"."notifications"."action_url" IS 'Optional URL to navigate to when clicking notification';



COMMENT ON COLUMN "public"."notifications"."read_status" IS 'Whether the notification has been read by the user';



COMMENT ON COLUMN "public"."notifications"."read_at" IS 'Timestamp when the notification was marked as read';



CREATE TABLE IF NOT EXISTS "public"."office_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "latitude" numeric(10,8) NOT NULL,
    "longitude" numeric(11,8) NOT NULL,
    "radius_meters" integer DEFAULT 100 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."office_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overtime_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "attendance_id" "uuid",
    "work_date" "date" NOT NULL,
    "check_in_time" timestamp with time zone,
    "check_out_time" timestamp with time zone,
    "scheduled_hours" numeric DEFAULT 8.0,
    "actual_hours" numeric,
    "overtime_hours" numeric DEFAULT 0.0,
    "hourly_rate" numeric,
    "overtime_multiplier" numeric DEFAULT 1.5,
    "overtime_amount" numeric DEFAULT 0.0,
    "day_type" "text" DEFAULT 'weekday'::"text",
    "status" "text" DEFAULT 'Pending'::"text",
    "approval_date" "date",
    "approved_by" "uuid",
    "rejection_reason" "text",
    "hr_comments" "text",
    "manually_adjusted" boolean DEFAULT false,
    "original_hours" numeric,
    "adjustment_reason" "text",
    "adjusted_by" "uuid",
    "adjusted_at" timestamp with time zone,
    "payment_status" "text" DEFAULT 'Unpaid'::"text",
    "payment_date" "date",
    "payroll_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "overtime_amount_positive" CHECK (("overtime_amount" >= (0)::numeric)),
    CONSTRAINT "overtime_hours_positive" CHECK (("overtime_hours" >= (0)::numeric)),
    CONSTRAINT "overtime_records_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['Unpaid'::"text", 'Paid'::"text", 'Processing'::"text"]))),
    CONSTRAINT "overtime_records_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Rejected'::"text", 'Processed'::"text"])))
);


ALTER TABLE "public"."overtime_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."overtime_records" IS 'Records of overtime hours calculated from attendance or manually entered';



COMMENT ON COLUMN "public"."overtime_records"."day_type" IS 'Type of day: weekday, weekend, or holiday - affects overtime multiplier';



COMMENT ON COLUMN "public"."overtime_records"."manually_adjusted" IS 'Flag indicating if overtime hours were manually adjusted by HR';



COMMENT ON COLUMN "public"."overtime_records"."payment_status" IS 'Payment tracking: Unpaid, Paid, or Processing';



CREATE TABLE IF NOT EXISTS "public"."overtime_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "request_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "requested_hours" numeric NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "review_comments" "text",
    "overtime_record_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "attendance_id" "uuid",
    "request_type" "text" DEFAULT 'manual'::"text",
    CONSTRAINT "overtime_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['manual'::"text", 'pre_approved'::"text"]))),
    CONSTRAINT "overtime_requests_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."overtime_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."overtime_requests" IS 'Manual overtime requests submitted by employees for pre-approval';



CREATE TABLE IF NOT EXISTS "public"."overtime_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "rule_description" "text",
    "standard_hours_per_day" numeric DEFAULT 8.0,
    "standard_hours_per_week" numeric DEFAULT 40.0,
    "minimum_overtime_minutes" numeric DEFAULT 15,
    "rounding_minutes" numeric DEFAULT 15,
    "weekday_multiplier" numeric DEFAULT 1.5,
    "weekend_multiplier" numeric DEFAULT 2.0,
    "holiday_multiplier" numeric DEFAULT 2.5,
    "max_overtime_hours_per_day" numeric DEFAULT 4.0,
    "max_overtime_hours_per_month" numeric DEFAULT 40.0,
    "is_active" boolean DEFAULT true,
    "effective_from" "date" DEFAULT CURRENT_DATE,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "require_pre_approval" boolean DEFAULT false
);


ALTER TABLE "public"."overtime_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."overtime_rules" IS 'Configuration table for overtime calculation rules and policies';



CREATE TABLE IF NOT EXISTS "public"."password_reset_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."password_reset_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."password_reset_codes" IS 'Stores 6-digit confirmation codes for password reset';



COMMENT ON COLUMN "public"."password_reset_codes"."email" IS 'Email address of the user requesting reset';



COMMENT ON COLUMN "public"."password_reset_codes"."code" IS '6-digit confirmation code';



COMMENT ON COLUMN "public"."password_reset_codes"."expires_at" IS 'Expiration timestamp (codes valid for 15 minutes)';



COMMENT ON COLUMN "public"."password_reset_codes"."used_at" IS 'Timestamp when code was used (null if unused)';



CREATE TABLE IF NOT EXISTS "public"."professional_upgrade_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "upgrade_type" "public"."upgrade_type_enum" NOT NULL,
    "current_qualification" "text",
    "target_qualification" "text" NOT NULL,
    "institution" "text",
    "program_name" "text",
    "start_date" "date",
    "expected_completion_date" "date",
    "estimated_cost" numeric,
    "reason" "text",
    "status" "public"."upgrade_status_enum" DEFAULT 'Pending'::"public"."upgrade_status_enum",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "hr_review_notes" "text",
    "hr_decision_date" "date",
    "action_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."professional_upgrade_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."super_admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "full_name" character varying(255),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."super_admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "training_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "attendance_status" "text" DEFAULT 'Not Started'::"text",
    "completion_status" "text" DEFAULT 'Not Completed'::"text",
    "certificate_url" "text",
    "score" numeric,
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."training_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "training_type" "public"."training_type_enum" DEFAULT 'Other'::"public"."training_type_enum" NOT NULL,
    "trainer_name" "text" NOT NULL,
    "provider" "public"."training_provider_enum" DEFAULT 'Internal'::"public"."training_provider_enum" NOT NULL,
    "department" "text",
    "location" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "duration" "text",
    "budget" numeric,
    "status" "public"."training_status_enum" DEFAULT 'Planned'::"public"."training_status_enum" NOT NULL,
    "attachment_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trainings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "employee_id" "uuid",
    "role" "public"."user_role_enum" DEFAULT 'employee'::"public"."user_role_enum" NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_settings"
    ADD CONSTRAINT "attendance_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearance_approvals"
    ADD CONSTRAINT "clearance_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearance_documents"
    ADD CONSTRAINT "clearance_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearance_requests"
    ADD CONSTRAINT "clearance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearance_task_templates"
    ADD CONSTRAINT "clearance_task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clearance_tasks"
    ADD CONSTRAINT "clearance_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_visits"
    ADD CONSTRAINT "field_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_notes"
    ADD CONSTRAINT "hr_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_registration_number_key" UNIQUE ("registration_number");



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_postings"
    ADD CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_employee_id_leave_year_key" UNIQUE ("employee_id", "leave_year");



ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_locations"
    ADD CONSTRAINT "office_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overtime_rules"
    ADD CONSTRAINT "overtime_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_codes"
    ADD CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_upgrade_requests"
    ADD CONSTRAINT "professional_upgrade_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."super_admin_users"
    ADD CONSTRAINT "super_admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."super_admin_users"
    ADD CONSTRAINT "super_admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_participants"
    ADD CONSTRAINT "training_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_participants"
    ADD CONSTRAINT "training_participants_training_id_employee_id_key" UNIQUE ("training_id", "employee_id");



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "unique_employee_date" UNIQUE ("employee_id", "work_date");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_clock_in_time" ON "public"."attendance" USING "btree" ("clock_in_time");



CREATE INDEX "idx_attendance_date" ON "public"."attendance" USING "btree" ("date");



CREATE INDEX "idx_attendance_employee_date" ON "public"."attendance" USING "btree" ("employee_id", "date");



CREATE INDEX "idx_attendance_employee_id" ON "public"."attendance" USING "btree" ("employee_id");



CREATE INDEX "idx_attendance_status" ON "public"."attendance" USING "btree" ("status");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_table" ON "public"."audit_logs" USING "btree" ("table_name");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_chat_messages_conversation" ON "public"."chat_messages" USING "btree" ("sender_id", "receiver_id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_messages_receiver" ON "public"."chat_messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_chat_messages_sender" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_clearance_approvals_clearance_request_id" ON "public"."clearance_approvals" USING "btree" ("clearance_request_id");



CREATE INDEX "idx_clearance_documents_clearance_request_id" ON "public"."clearance_documents" USING "btree" ("clearance_request_id");



CREATE INDEX "idx_clearance_documents_employee_id" ON "public"."clearance_documents" USING "btree" ("employee_id");



CREATE INDEX "idx_clearance_documents_status" ON "public"."clearance_documents" USING "btree" ("status");



CREATE INDEX "idx_clearance_requests_employee_id" ON "public"."clearance_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_clearance_requests_status" ON "public"."clearance_requests" USING "btree" ("status");



CREATE INDEX "idx_clearance_requests_submitted_at" ON "public"."clearance_requests" USING "btree" ("submitted_at");



CREATE INDEX "idx_clearance_tasks_clearance_request_id" ON "public"."clearance_tasks" USING "btree" ("clearance_request_id");



CREATE INDEX "idx_clearance_tasks_status" ON "public"."clearance_tasks" USING "btree" ("status");



CREATE INDEX "idx_email_queue_created_at" ON "public"."email_queue" USING "btree" ("created_at");



CREATE INDEX "idx_email_queue_status" ON "public"."email_queue" USING "btree" ("status");



CREATE INDEX "idx_employees_id" ON "public"."employees" USING "btree" ("employee_id");



CREATE INDEX "idx_employees_manager_id" ON "public"."employees" USING "btree" ("manager_id");



CREATE INDEX "idx_employees_role" ON "public"."employees" USING "btree" ("role");



CREATE INDEX "idx_employees_status" ON "public"."employees" USING "btree" ("employment_status");



CREATE INDEX "idx_employees_user_id" ON "public"."employees" USING "btree" ("user_id");



CREATE INDEX "idx_field_visits_created_at" ON "public"."field_visits" USING "btree" ("created_at");



CREATE INDEX "idx_field_visits_employee_id" ON "public"."field_visits" USING "btree" ("employee_id");



CREATE INDEX "idx_field_visits_status" ON "public"."field_visits" USING "btree" ("status");



CREATE INDEX "idx_field_visits_visit_date" ON "public"."field_visits" USING "btree" ("visit_date");



CREATE INDEX "idx_hr_notes_created_at" ON "public"."hr_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_hr_notes_created_by" ON "public"."hr_notes" USING "btree" ("created_by");



CREATE INDEX "idx_internships_assigned_department" ON "public"."internships" USING "btree" ("assigned_department");



CREATE INDEX "idx_internships_created_at" ON "public"."internships" USING "btree" ("created_at");



CREATE INDEX "idx_internships_registration_number" ON "public"."internships" USING "btree" ("registration_number");



CREATE INDEX "idx_internships_start_date" ON "public"."internships" USING "btree" ("start_date");



CREATE INDEX "idx_internships_status" ON "public"."internships" USING "btree" ("status");



CREATE INDEX "idx_internships_supervisor_id" ON "public"."internships" USING "btree" ("supervisor_id");



CREATE INDEX "idx_interviews_application" ON "public"."interviews" USING "btree" ("application_id");



CREATE INDEX "idx_interviews_date" ON "public"."interviews" USING "btree" ("interview_date");



CREATE INDEX "idx_interviews_status" ON "public"."interviews" USING "btree" ("status");



CREATE INDEX "idx_job_applications_applicant" ON "public"."job_applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_job_applications_job" ON "public"."job_applications" USING "btree" ("job_id");



CREATE INDEX "idx_job_applications_status" ON "public"."job_applications" USING "btree" ("status");



CREATE INDEX "idx_job_postings_posted_by" ON "public"."job_postings" USING "btree" ("posted_by");



CREATE INDEX "idx_job_postings_status" ON "public"."job_postings" USING "btree" ("status");



CREATE INDEX "idx_leave_balances_employee" ON "public"."leave_balances" USING "btree" ("employee_id");



CREATE INDEX "idx_leave_requests_dates" ON "public"."leave_requests" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_leave_requests_employee" ON "public"."leave_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_leave_requests_status" ON "public"."leave_requests" USING "btree" ("status");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_employee_id" ON "public"."notifications" USING "btree" ("employee_id");



CREATE INDEX "idx_notifications_read_status" ON "public"."notifications" USING "btree" ("read_status");



CREATE INDEX "idx_notifications_related_entity" ON "public"."notifications" USING "btree" ("related_entity_type", "related_entity_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_office_locations_active" ON "public"."office_locations" USING "btree" ("is_active");



CREATE INDEX "idx_overtime_records_attendance_id" ON "public"."overtime_records" USING "btree" ("attendance_id");



CREATE INDEX "idx_overtime_records_employee_date" ON "public"."overtime_records" USING "btree" ("employee_id", "work_date");



CREATE INDEX "idx_overtime_records_employee_id" ON "public"."overtime_records" USING "btree" ("employee_id");



CREATE INDEX "idx_overtime_records_payment_status" ON "public"."overtime_records" USING "btree" ("payment_status");



CREATE INDEX "idx_overtime_records_status" ON "public"."overtime_records" USING "btree" ("status");



CREATE INDEX "idx_overtime_records_work_date" ON "public"."overtime_records" USING "btree" ("work_date");



CREATE INDEX "idx_overtime_requests_employee_id" ON "public"."overtime_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_overtime_requests_request_date" ON "public"."overtime_requests" USING "btree" ("request_date");



CREATE INDEX "idx_overtime_requests_status" ON "public"."overtime_requests" USING "btree" ("status");



CREATE INDEX "idx_overtime_rules_active" ON "public"."overtime_rules" USING "btree" ("is_active", "effective_from");



CREATE INDEX "idx_password_reset_codes_code" ON "public"."password_reset_codes" USING "btree" ("code");



CREATE INDEX "idx_password_reset_codes_email" ON "public"."password_reset_codes" USING "btree" ("email");



CREATE INDEX "idx_password_reset_codes_expires_at" ON "public"."password_reset_codes" USING "btree" ("expires_at");



CREATE INDEX "idx_super_admin_users_email" ON "public"."super_admin_users" USING "btree" ("email");



CREATE INDEX "idx_training_participants_attendance_status" ON "public"."training_participants" USING "btree" ("attendance_status");



CREATE INDEX "idx_training_participants_completion_status" ON "public"."training_participants" USING "btree" ("completion_status");



CREATE INDEX "idx_training_participants_employee_id" ON "public"."training_participants" USING "btree" ("employee_id");



CREATE INDEX "idx_training_participants_training_id" ON "public"."training_participants" USING "btree" ("training_id");



CREATE INDEX "idx_trainings_created_at" ON "public"."trainings" USING "btree" ("created_at");



CREATE INDEX "idx_trainings_department" ON "public"."trainings" USING "btree" ("department");



CREATE INDEX "idx_trainings_start_date" ON "public"."trainings" USING "btree" ("start_date");



CREATE INDEX "idx_trainings_status" ON "public"."trainings" USING "btree" ("status");



CREATE INDEX "idx_trainings_training_type" ON "public"."trainings" USING "btree" ("training_type");



CREATE INDEX "idx_upgrade_requests_employee" ON "public"."professional_upgrade_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_upgrade_requests_status" ON "public"."professional_upgrade_requests" USING "btree" ("status");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "auto_link_user_employee_trigger" BEFORE INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."auto_link_user_to_employee"();



CREATE OR REPLACE TRIGGER "employees_last_updated_trigger" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated"();



CREATE OR REPLACE TRIGGER "employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "field_visits_updated_at" BEFORE UPDATE ON "public"."field_visits" FOR EACH ROW EXECUTE FUNCTION "public"."update_field_visits_updated_at"();



CREATE OR REPLACE TRIGGER "internships_updated_at" BEFORE UPDATE ON "public"."internships" FOR EACH ROW EXECUTE FUNCTION "public"."update_internships_updated_at"();



CREATE OR REPLACE TRIGGER "interviews_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."interviews" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "interviews_updated_at" BEFORE UPDATE ON "public"."interviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "job_applications_updated_at" BEFORE UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "job_postings_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."job_postings" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "job_postings_updated_at" BEFORE UPDATE ON "public"."job_postings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "leave_balances_updated_at" BEFORE UPDATE ON "public"."leave_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "leave_requests_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "leave_requests_updated_at" BEFORE UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trainings_updated_at" BEFORE UPDATE ON "public"."trainings" FOR EACH ROW EXECUTE FUNCTION "public"."update_trainings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_calculate_overtime" AFTER UPDATE OF "clock_out_time" ON "public"."attendance" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_overtime_from_attendance"();



CREATE OR REPLACE TRIGGER "update_attendance_settings_updated_at" BEFORE UPDATE ON "public"."attendance_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_attendance_updated_at" BEFORE UPDATE ON "public"."attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clearance_documents_updated_at" BEFORE UPDATE ON "public"."clearance_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clearance_requests_updated_at" BEFORE UPDATE ON "public"."clearance_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clearance_tasks_updated_at" BEFORE UPDATE ON "public"."clearance_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_office_locations_updated_at" BEFORE UPDATE ON "public"."office_locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_overtime_records_updated_at" BEFORE UPDATE ON "public"."overtime_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_overtime_requests_updated_at" BEFORE UPDATE ON "public"."overtime_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_overtime_rules_updated_at" BEFORE UPDATE ON "public"."overtime_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_super_admin_users_updated_at" BEFORE UPDATE ON "public"."super_admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "upgrade_requests_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."professional_upgrade_requests" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "upgrade_requests_updated_at" BEFORE UPDATE ON "public"."professional_upgrade_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clearance_approvals"
    ADD CONSTRAINT "clearance_approvals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_approvals"
    ADD CONSTRAINT "clearance_approvals_clearance_request_id_fkey" FOREIGN KEY ("clearance_request_id") REFERENCES "public"."clearance_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clearance_documents"
    ADD CONSTRAINT "clearance_documents_clearance_request_id_fkey" FOREIGN KEY ("clearance_request_id") REFERENCES "public"."clearance_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clearance_documents"
    ADD CONSTRAINT "clearance_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clearance_documents"
    ADD CONSTRAINT "clearance_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_documents"
    ADD CONSTRAINT "clearance_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_requests"
    ADD CONSTRAINT "clearance_requests_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_requests"
    ADD CONSTRAINT "clearance_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_requests"
    ADD CONSTRAINT "clearance_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clearance_requests"
    ADD CONSTRAINT "clearance_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_requests"
    ADD CONSTRAINT "clearance_requests_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_tasks"
    ADD CONSTRAINT "clearance_tasks_clearance_request_id_fkey" FOREIGN KEY ("clearance_request_id") REFERENCES "public"."clearance_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clearance_tasks"
    ADD CONSTRAINT "clearance_tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_tasks"
    ADD CONSTRAINT "clearance_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clearance_tasks"
    ADD CONSTRAINT "clearance_tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_visits"
    ADD CONSTRAINT "field_visits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "fk_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "fk_interviews_application" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "fk_interviews_scheduled_by" FOREIGN KEY ("scheduled_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "fk_job_applications_applicant" FOREIGN KEY ("applicant_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "fk_job_applications_job" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_postings"
    ADD CONSTRAINT "fk_job_postings_posted_by" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "fk_leave_balances_employee" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "fk_leave_requests_action_by" FOREIGN KEY ("action_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "fk_leave_requests_employee" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_upgrade_requests"
    ADD CONSTRAINT "fk_upgrade_requests_action_by" FOREIGN KEY ("action_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."professional_upgrade_requests"
    ADD CONSTRAINT "fk_upgrade_requests_employee" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_employee" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hr_notes"
    ADD CONSTRAINT "hr_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overtime_records"
    ADD CONSTRAINT "overtime_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_overtime_record_id_fkey" FOREIGN KEY ("overtime_record_id") REFERENCES "public"."overtime_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."overtime_rules"
    ADD CONSTRAINT "overtime_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."overtime_rules"
    ADD CONSTRAINT "overtime_rules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."training_participants"
    ADD CONSTRAINT "training_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_participants"
    ADD CONSTRAINT "training_participants_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated super admins to delete super admin users" ON "public"."super_admin_users" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow authenticated super admins to insert super admin users" ON "public"."super_admin_users" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow authenticated super admins to read super admin users" ON "public"."super_admin_users" FOR SELECT USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow authenticated super admins to update super admin users" ON "public"."super_admin_users" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Anyone can insert attendance" ON "public"."attendance" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can view employees" ON "public"."employees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Edge functions can insert email queue" ON "public"."email_queue" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Employees can update own data" ON "public"."employees" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "HR can delete email queue" ON "public"."email_queue" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'hr'::"public"."user_role_enum")))));



CREATE POLICY "HR can insert email queue" ON "public"."email_queue" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'hr'::"public"."user_role_enum")))));



CREATE POLICY "HR can update email queue" ON "public"."email_queue" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'hr'::"public"."user_role_enum")))));



CREATE POLICY "HR can view email queue" ON "public"."email_queue" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'hr'::"public"."user_role_enum")))));



CREATE POLICY "Users can insert reset codes" ON "public"."password_reset_codes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can send messages" ON "public"."chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update read status" ON "public"."chat_messages" FOR UPDATE USING (("auth"."uid"() = "receiver_id"));



CREATE POLICY "Users can update reset codes" ON "public"."password_reset_codes" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can verify reset codes" ON "public"."password_reset_codes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view their own messages" ON "public"."chat_messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "allow_insert_reset_codes" ON "public"."password_reset_codes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_use_reset_codes" ON "public"."password_reset_codes" TO "authenticated" USING (true);



ALTER TABLE "public"."email_queue" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_insert_own_applications" ON "public"."job_applications" FOR INSERT TO "authenticated" WITH CHECK (((NOT "public"."is_hr"()) AND ("applicant_id" = "public"."get_employee_id"())));



CREATE POLICY "employees_update_documents" ON "public"."employees" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'hr'::"public"."user_role_enum"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'hr'::"public"."user_role_enum")))));



CREATE POLICY "employees_update_own_applications" ON "public"."job_applications" FOR UPDATE TO "authenticated" USING (("applicant_id" = "public"."get_employee_id"())) WITH CHECK (("applicant_id" = "public"."get_employee_id"()));



ALTER TABLE "public"."super_admin_users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_link_user_to_employee"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_link_user_to_employee"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_link_user_to_employee"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_overtime_from_attendance"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_overtime_from_attendance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_overtime_from_attendance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_work_hours"("clock_in" timestamp with time zone, "clock_out" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_work_hours"("clock_in" timestamp with time zone, "clock_out" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_work_hours"("clock_in" timestamp with time zone, "clock_out" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_employee_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_employee_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_employee_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."determine_attendance_status"("clock_in_time" timestamp with time zone, "work_start_time" time without time zone, "grace_period_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."determine_attendance_status"("clock_in_time" timestamp with time zone, "work_start_time" time without time zone, "grace_period_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."determine_attendance_status"("clock_in_time" timestamp with time zone, "work_start_time" time without time zone, "grace_period_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation"("user1_id" "uuid", "user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation"("user1_id" "uuid", "user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation"("user1_id" "uuid", "user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_department_overtime_summary"("p_department" "text", "p_year" integer, "p_month" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_department_overtime_summary"("p_department" "text", "p_year" integer, "p_month" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_department_overtime_summary"("p_department" "text", "p_year" integer, "p_month" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_overtime_summary"("p_employee_id" "uuid", "p_year" integer, "p_month" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_overtime_summary"("p_employee_id" "uuid", "p_year" integer, "p_month" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_overtime_summary"("p_employee_id" "uuid", "p_year" integer, "p_month" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_hr"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_hr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_hr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_within_office_distance"("employee_lat" numeric, "employee_lng" numeric, "office_lat" numeric, "office_lng" numeric, "max_distance_meters" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_within_office_distance"("employee_lat" numeric, "employee_lng" numeric, "office_lat" numeric, "office_lng" numeric, "max_distance_meters" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_within_office_distance"("employee_lat" numeric, "employee_lng" numeric, "office_lat" numeric, "office_lng" numeric, "max_distance_meters" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("sender_id_param" "uuid", "receiver_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("sender_id_param" "uuid", "receiver_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("sender_id_param" "uuid", "receiver_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_all_hrs"("p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_all_hrs"("p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_all_hrs"("p_title" "text", "p_message" "text", "p_type" "text", "p_category" "text", "p_related_entity_type" "text", "p_related_entity_id" "uuid", "p_action_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_hr_new_job_application"("p_job_application_id" "uuid", "p_job_title" "text", "p_applicant_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_hr_new_job_application"("p_job_application_id" "uuid", "p_job_title" "text", "p_applicant_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_hr_new_job_application"("p_job_application_id" "uuid", "p_job_title" "text", "p_applicant_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_hr_new_leave_request"("p_leave_request_id" "uuid", "p_employee_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_hr_new_leave_request"("p_leave_request_id" "uuid", "p_employee_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_hr_new_leave_request"("p_leave_request_id" "uuid", "p_employee_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_hr_new_overtime_request"("p_overtime_request_id" "uuid", "p_employee_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_hr_new_overtime_request"("p_overtime_request_id" "uuid", "p_employee_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_hr_new_overtime_request"("p_overtime_request_id" "uuid", "p_employee_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_hr_new_upgrade_request"("p_upgrade_request_id" "uuid", "p_employee_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_hr_new_upgrade_request"("p_upgrade_request_id" "uuid", "p_employee_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_hr_new_upgrade_request"("p_upgrade_request_id" "uuid", "p_employee_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_interview_scheduled"("p_employee_id" "uuid", "p_user_id" "uuid", "p_interview_id" "uuid", "p_job_title" "text", "p_interview_date" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."notify_interview_scheduled"("p_employee_id" "uuid", "p_user_id" "uuid", "p_interview_id" "uuid", "p_job_title" "text", "p_interview_date" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_interview_scheduled"("p_employee_id" "uuid", "p_user_id" "uuid", "p_interview_id" "uuid", "p_job_title" "text", "p_interview_date" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_job_application_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_job_application_id" "uuid", "p_job_title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_job_application_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_job_application_id" "uuid", "p_job_title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_job_application_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_job_application_id" "uuid", "p_job_title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_leave_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_leave_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_leave_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_leave_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_leave_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_leave_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_overtime_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_overtime_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_overtime_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_overtime_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_overtime_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_overtime_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_upgrade_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_upgrade_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_upgrade_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_upgrade_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_upgrade_request_status"("p_employee_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_upgrade_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_field_visits_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_field_visits_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_field_visits_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_internships_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_internships_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_internships_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leave_balance"("p_employee_id" "uuid", "p_leave_type" "text", "p_days" numeric, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_leave_balance"("p_employee_id" "uuid", "p_leave_type" "text", "p_days" numeric, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leave_balance"("p_employee_id" "uuid", "p_leave_type" "text", "p_days" numeric, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trainings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trainings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trainings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_settings" TO "anon";
GRANT ALL ON TABLE "public"."attendance_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_settings" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."clearance_approvals" TO "anon";
GRANT ALL ON TABLE "public"."clearance_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."clearance_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."clearance_documents" TO "anon";
GRANT ALL ON TABLE "public"."clearance_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."clearance_documents" TO "service_role";



GRANT ALL ON TABLE "public"."clearance_requests" TO "anon";
GRANT ALL ON TABLE "public"."clearance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."clearance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."clearance_task_templates" TO "anon";
GRANT ALL ON TABLE "public"."clearance_task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."clearance_task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."clearance_tasks" TO "anon";
GRANT ALL ON TABLE "public"."clearance_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."clearance_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."email_queue" TO "anon";
GRANT ALL ON TABLE "public"."email_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."email_queue" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."field_visits" TO "anon";
GRANT ALL ON TABLE "public"."field_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."field_visits" TO "service_role";



GRANT ALL ON TABLE "public"."hr_notes" TO "anon";
GRANT ALL ON TABLE "public"."hr_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_notes" TO "service_role";



GRANT ALL ON TABLE "public"."internships" TO "anon";
GRANT ALL ON TABLE "public"."internships" TO "authenticated";
GRANT ALL ON TABLE "public"."internships" TO "service_role";



GRANT ALL ON TABLE "public"."interviews" TO "anon";
GRANT ALL ON TABLE "public"."interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."interviews" TO "service_role";



GRANT ALL ON TABLE "public"."job_applications" TO "anon";
GRANT ALL ON TABLE "public"."job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applications" TO "service_role";



GRANT ALL ON TABLE "public"."job_postings" TO "anon";
GRANT ALL ON TABLE "public"."job_postings" TO "authenticated";
GRANT ALL ON TABLE "public"."job_postings" TO "service_role";



GRANT ALL ON TABLE "public"."leave_balances" TO "anon";
GRANT ALL ON TABLE "public"."leave_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_balances" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."office_locations" TO "anon";
GRANT ALL ON TABLE "public"."office_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."office_locations" TO "service_role";



GRANT ALL ON TABLE "public"."overtime_records" TO "anon";
GRANT ALL ON TABLE "public"."overtime_records" TO "authenticated";
GRANT ALL ON TABLE "public"."overtime_records" TO "service_role";



GRANT ALL ON TABLE "public"."overtime_requests" TO "anon";
GRANT ALL ON TABLE "public"."overtime_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."overtime_requests" TO "service_role";



GRANT ALL ON TABLE "public"."overtime_rules" TO "anon";
GRANT ALL ON TABLE "public"."overtime_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."overtime_rules" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_codes" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_codes" TO "service_role";



GRANT ALL ON TABLE "public"."professional_upgrade_requests" TO "anon";
GRANT ALL ON TABLE "public"."professional_upgrade_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_upgrade_requests" TO "service_role";



GRANT ALL ON TABLE "public"."super_admin_users" TO "anon";
GRANT ALL ON TABLE "public"."super_admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."super_admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."training_participants" TO "anon";
GRANT ALL ON TABLE "public"."training_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."training_participants" TO "service_role";



GRANT ALL ON TABLE "public"."trainings" TO "anon";
GRANT ALL ON TABLE "public"."trainings" TO "authenticated";
GRANT ALL ON TABLE "public"."trainings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



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







