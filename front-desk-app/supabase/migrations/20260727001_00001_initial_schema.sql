-- ============================================================
-- Vector Front Desk ERP — Complete Database Schema
-- Migration: 20260727_00001_initial_schema
-- Description: Creates all tables based on the schema design
-- No Row Level Security (RLS) is applied.
-- ============================================================

-- -----------------------------------------------------------
-- 1. departments
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 2. users
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    username      TEXT NOT NULL,
    password_hash TEXT,
    email         TEXT,
    phone         TEXT,
    role          TEXT CHECK (role IN ('admin', 'designer', 'front_desk', 'machine_operator')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 3. files
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    path        TEXT NOT NULL,
    mime_type   TEXT,
    file_size   BIGINT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 4. clients (Unified Leads + Clients)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_type             TEXT CHECK (client_type IN ('lead', 'client')),
    name                    TEXT NOT NULL,
    company_name            TEXT,
    phone                   TEXT,
    email                   TEXT,
    alt_email               TEXT,
    address                 TEXT,
    city                    TEXT,
    subcity                 TEXT,
    woreda                  TEXT,
    region                  TEXT,
    po_box                  TEXT,
    type                    TEXT CHECK (type IN ('Corporate', 'Individual', 'Government')),
    industry                TEXT,
    website                 TEXT,
    description             TEXT,
    point_of_contact        TEXT,
    priority                TEXT,
    source                  TEXT,
    source_heard            TEXT,
    budget                  NUMERIC,
    timeframe               TEXT,
    interests               JSONB DEFAULT '[]'::jsonb,
    assigned_sales_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    followup_date           DATE,
    tin                     TEXT,
    vat_number              TEXT,
    reg_number              TEXT,
    date_established        DATE,
    credit_limit            NUMERIC DEFAULT 0,
    payment_terms           TEXT,
    currency                TEXT DEFAULT 'ETB',
    opening_balance         NUMERIC DEFAULT 0,
    total_orders            INTEGER DEFAULT 0,
    total_sales             NUMERIC DEFAULT 0,
    paid_amount             NUMERIC DEFAULT 0,
    loyalty_level           TEXT,
    account_manager         TEXT,
    referral_source         TEXT,
    status                  TEXT DEFAULT 'New' CHECK (status IN ('New', 'Active', 'Inactive', 'Converted', 'Lost', 'Prospective')),
    registered_on           DATE,
    converted_at            TIMESTAMPTZ,
    document_file_ids       UUID[] DEFAULT '{}',
    allow_self_update       BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 5. client_contacts
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT,
    email       TEXT,
    role        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 6. site_visits
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_visits (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    request_no          TEXT,
    visit_purpose       TEXT,
    city                TEXT,
    detailed_address    TEXT,
    requested_date      DATE,
    preferred_date      DATE,
    preferred_time      TIME,
    requested_by        TEXT,
    department          TEXT,
    installation_team   TEXT,
    contact_person      TEXT,
    phone               TEXT,
    email               TEXT,
    equipment_review    TEXT,
    special_instructions TEXT,
    status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    priority            TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 7. items
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    pcs         NUMERIC DEFAULT 0,
    kilo        NUMERIC DEFAULT 0,
    care        NUMERIC DEFAULT 0,
    liter       NUMERIC DEFAULT 0,
    meter       NUMERIC DEFAULT 0,
    pack        NUMERIC DEFAULT 0,
    gram        NUMERIC DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 8. orders
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    order_no            TEXT,
    order_date          DATE,
    required_date       DATE,
    status              TEXT DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'In Production', 'Completed', 'Cancelled')),
    priority            TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    total_amount        NUMERIC DEFAULT 0,
    paid_amount         NUMERIC DEFAULT 0,
    balance             NUMERIC DEFAULT 0,
    reference_po        TEXT,
    sales_officer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    currency            TEXT DEFAULT 'ETB',
    payment_terms       TEXT,
    special_instructions TEXT,
    attachments         UUID[] DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 9. order_items
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id         UUID REFERENCES items(id) ON DELETE SET NULL,
    quantity        NUMERIC DEFAULT 1,
    description     TEXT,
    unit            TEXT,
    unit_price      NUMERIC DEFAULT 0,
    discount_percent NUMERIC DEFAULT 0,
    tax_percent     NUMERIC DEFAULT 0,
    amount          NUMERIC DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 10. designs
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS designs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    design_type         TEXT,
    purpose             TEXT,
    requested_date      DATE,
    required_date       DATE,
    priority            TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    assigned_designer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requested_by        TEXT,
    brief_dimensions    TEXT,
    specifications      TEXT,
    special_instructions TEXT,
    attached_file_ids   UUID[] DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 11. design_versions
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS design_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id       UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    file_id         UUID REFERENCES files(id) ON DELETE SET NULL,
    version_number  INTEGER NOT NULL,
    description     TEXT,
    sent_on         TIMESTAMPTZ,
    sent_by         TEXT,
    status          TEXT DEFAULT 'Sent' CHECK (status IN ('Sent', 'Reviewed', 'Approved', 'Rejected')),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 12. warranties
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS warranties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id       UUID REFERENCES order_items(id) ON DELETE SET NULL,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    product_name        TEXT,
    serial_no           TEXT,
    purchase_date       DATE,
    warranty_expiry     DATE,
    defect_description  TEXT,
    attachments         UUID[] DEFAULT '{}',
    claim_type          TEXT,
    assigned_to         TEXT,
    resolution          TEXT,
    status              TEXT DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Approved', 'Rejected', 'Closed')),
    filed_at            TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 13. invoices
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_no      TEXT,
    invoice_type    TEXT CHECK (invoice_type IN ('Proforma', 'Sales Invoice')),
    issue_date      DATE,
    due_date        DATE,
    reference       TEXT,
    subtotal        NUMERIC DEFAULT 0,
    vat_amount      NUMERIC DEFAULT 0,
    grand_total     NUMERIC DEFAULT 0,
    paid_amount     NUMERIC DEFAULT 0,
    balance         NUMERIC DEFAULT 0,
    status          TEXT DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Partially Paid', 'Pending')),
    payment_method  TEXT,
    bank_name       TEXT,
    receipt_issued  BOOLEAN DEFAULT FALSE,
    receipt_date    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 14. invoice_items
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id     UUID REFERENCES items(id) ON DELETE SET NULL,
    description TEXT,
    quantity    NUMERIC DEFAULT 1,
    unit_price  NUMERIC DEFAULT 0,
    total       NUMERIC DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 15. payments
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payment_date      DATE,
    amount_paid       NUMERIC DEFAULT 0,
    gross_amount      NUMERIC DEFAULT 0,
    unpaid_amount     NUMERIC DEFAULT 0,
    payment_method    TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Mobile Money', 'Card', 'E-commerce')),
    bank_wallet       TEXT,
    reference_number  TEXT,
    received_by       TEXT,
    invoice_status    TEXT CHECK (invoice_status IN ('Unpaid', 'Paid', 'Partially Paid')),
    processing_status TEXT CHECK (processing_status IN ('Requires Payment Method', 'Requires Action', 'Processing', 'Requires Capture', 'Succeeded', 'Failed', 'Canceled')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 16. job_orders
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    job_no          TEXT,
    collaboration   TEXT,
    order_status    TEXT DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Started', 'Completed')),
    start_time      TIMESTAMPTZ,
    delivery_time   TIMESTAMPTZ,
    expected_date   DATE,
    follow_up       TEXT,
    delivery_status TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 17. deliveries
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_order_id        UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    delivery_no         TEXT,
    company             TEXT,
    delivery_address    TEXT,
    contact_person      TEXT,
    contact_phone       TEXT,
    items               JSONB DEFAULT '[]'::jsonb,
    vehicle_driver      TEXT,
    scheduled_date      DATE,
    scheduled_time      TIME,
    actual_delivery_time TIMESTAMPTZ,
    status              TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Transit', 'Delivered', 'Delayed')),
    received_by         TEXT,
    logged_by           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 18. installations
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS installations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_order_id        UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    installation_no     TEXT,
    site_address        TEXT,
    contact_person      TEXT,
    contact_phone       TEXT,
    items_installed     JSONB DEFAULT '[]'::jsonb,
    team                TEXT,
    team_lead           TEXT,
    scheduled_date      DATE,
    scheduled_time      TIME,
    completion_time     TIMESTAMPTZ,
    status              TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    signed_off_by       TEXT,
    logged_by           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 19. feedbacks
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    overall_rating      TEXT CHECK (overall_rating IN ('Excellent', 'Good', 'Average', 'Poor')),
    delivery_rating     TEXT,
    quality_rating      TEXT,
    staff_service_rating TEXT,
    recommend           TEXT CHECK (recommend IN ('Yes', 'No')),
    comments            TEXT,
    submitted_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 20. complaints
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    order_ref       TEXT,
    category        TEXT,
    severity        TEXT,
    subject         TEXT,
    description     TEXT,
    attachments     UUID[] DEFAULT '{}',
    assigned_to     TEXT,
    resolution      TEXT,
    status          TEXT DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved', 'Closed')),
    sla_breached    BOOLEAN DEFAULT FALSE,
    logged_at       TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 21. messages
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text              TEXT,
    is_read           BOOLEAN DEFAULT FALSE,
    attached_file_ids UUID[] DEFAULT '{}',
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 22. notifications
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    body            TEXT,
    icon            TEXT,
    color           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 23. read_notifications
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS read_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ
);

-- -----------------------------------------------------------
-- 24. notes
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT,
    entity_id   UUID,
    title       TEXT,
    content     TEXT,
    color       TEXT,
    pinned      BOOLEAN DEFAULT FALSE,
    checklist   JSONB DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_department_id   ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role             ON users(role);
CREATE INDEX IF NOT EXISTS idx_clients_client_type    ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_status         ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_sales_officer_id ON clients(assigned_sales_officer_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_client_id  ON site_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_status     ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id       ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sales_officer_id ON orders(sales_officer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_designs_order_id       ON designs(order_id);
CREATE INDEX IF NOT EXISTS idx_designs_assigned_designer_id ON designs(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_design_versions_design_id ON design_versions(design_id);
CREATE INDEX IF NOT EXISTS idx_warranties_order_id    ON warranties(order_id);
CREATE INDEX IF NOT EXISTS idx_warranties_client_id   ON warranties(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id      ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id    ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id     ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_invoice_id  ON job_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_job_order_id ON deliveries(job_order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_client_id   ON deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_installations_job_order_id ON installations(job_order_id);
CREATE INDEX IF NOT EXISTS idx_installations_client_id ON installations(client_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_order_id     ON feedbacks(order_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_client_id    ON feedbacks(client_id);
CREATE INDEX IF NOT EXISTS idx_complaints_order_id    ON complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_client_id   ON complaints(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id     ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id   ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_department_id ON notifications(department_id);
CREATE INDEX IF NOT EXISTS idx_read_notifications_user_id ON read_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_read_notifications_notification_id ON read_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id          ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_entity_type_entity_id ON notes(entity_type, entity_id);