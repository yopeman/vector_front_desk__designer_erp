# Complete Vector Front Desk ERP Database Schema

---

## departments

* id
* name
* description
* created_at
* updated_at

---

## users

* id
* department_id
* username
* password_hash
* email
* phone
* role: admin, designer, front desk officers, null
* created_at
* updated_at

---

## files

* id
* name
* path
* mime_type
* file_size
* uploaded_by
* uploaded_at

---

## clients (Unified Leads + Clients)

* id
* client_type (lead / client)
* name
* company_name
* phone
* email
* alt_email
* address
* city
* subcity
* woreda
* region
* po_box
* type (Corporate / Individual / Government)
* industry
* website
* description
* point_of_contact
* priority
* source
* source_heard
* budget
* timeframe
* interests (JSONB array)
* assigned_sales_officer_id
* followup_date
* tin
* vat_number
* reg_number
* date_established
* credit_limit
* payment_terms
* currency
* opening_balance
* total_orders
* total_sales
* paid_amount
* loyalty_level
* account_manager
* referral_source
* status (New / Active / Inactive / Converted / Lost / Prospective)
* registered_on
* converted_at
* document_file_ids (UUID[])
* allow_self_update
* created_at
* updated_at

---

## client_contacts

* id
* client_id
* name
* phone
* email
* role
* created_at
* updated_at

---

## site_visits

* id
* client_id
* request_no
* visit_purpose
* city
* detailed_address
* requested_date
* preferred_date
* preferred_time
* requested_by
* department
* installation_team
* contact_person
* phone
* email
* equipment_review
* special_instructions
* status (Pending / Scheduled / In Progress / Completed / Cancelled)
* priority (High / Medium / Low)
* notes
* created_at
* updated_at

---

## items

* id
* name
* pcs
* kilo
* care
* liter
* meter
* pack
* gram
* created_at
* updated_at

---

## orders

* id
* client_id
* order_no
* order_date
* required_date
* status (New / In Progress / In Production / Completed / Cancelled)
* priority (High / Medium / Low)
* total_amount
* paid_amount
* balance
* reference_po
* sales_officer_id
* department id
* currency
* payment_terms
* special_instructions
* attachments (UUID[])
* created_at
* updated_at

---

## order_items

* id
* order_id
* item_id
* quantity
* description
* unit
* unit_price
* discount_percent
* tax_percent
* amount
* created_at

---

## designs

* id
* order_id
* design_type
* purpose
* requested_date
* required_date
* priority (High / Medium / Low)
* status (Pending / In Progress / Completed / Cancelled)
* assigned_designer_id
* requested_by
* brief_dimensions
* specifications
* special_instructions
* internal_notes
* attached_file_ids (UUID[])
* created_at
* updated_at

---

## design_versions

* id
* design_id
* file_id
* version_number
* description
* sent_on
* sent_by
* status (Sent / Reviewed / Approved / Rejected)
* comment
* created_at

---

## warranties

* id
* order_id
* order_item_id (optional – to pinpoint a specific product)
* client_id
* product_name
* serial_no
* purchase_date
* warranty_expiry
* defect_description
* attachments (UUID[])
* claim_type
* assigned_to
* resolution
* status (New / In Progress / Approved / Rejected / Closed)
* filed_at
* closed_at
* created_at
* updated_at

---

## invoices

* id
* order_id
* invoice_no
* invoice_type (Proforma / Sales Invoice)
* issue_date
* due_date
* reference
* subtotal
* vat_amount
* grand_total
* paid_amount
* balance
* status (Unpaid / Paid / Partially Paid / Pending)
* payment_method (optional)
* bank_name (optional)
* receipt_issued
* receipt_date
* created_at
* updated_at

---

## invoice_items

* id
* invoice_id
* item_id
* description
* quantity
* unit_price
* total
* created_at

---

## payments

* id
* invoice_id
* client_id
* payment_date
* amount_paid
* gross_amount
* unpaid_amount
* payment_method (Cash / Bank Transfer / Mobile Money / Card / E-commerce)
* bank_wallet
* reference_number
* received_by
* notes
* invoice_status (Unpaid / Paid / Partially Paid)
* processing_status (Requires Payment Method / Requires Action / Processing / Requires Capture / Succeeded / Failed / Canceled)
* created_at
* updated_at

---

## job_orders

* id
* invoice_id
* job_no
* collaboration
* order_status (Pending / Started / Completed)
* start_time
* delivery_time
* expected_date
* follow_up
* delivery_status
* created_at
* updated_at

---

## deliveries

* id
* job_order_id
* client_id
* delivery_no
* company
* delivery_address
* contact_person
* contact_phone
* items (JSONB or TEXT)
* vehicle_driver
* scheduled_date
* scheduled_time
* actual_delivery_time
* status (Pending / In Transit / Delivered / Delayed)
* received_by
* logged_by
* notes
* created_at
* updated_at

---

## installations

* id
* job_order_id
* client_id
* installation_no
* site_address
* contact_person
* contact_phone
* items_installed (JSONB or TEXT)
* team
* team_lead
* scheduled_date
* scheduled_time
* completion_time
* status (Scheduled / In Progress / Completed / Cancelled)
* signed_off_by
* logged_by
* notes
* created_at
* updated_at

---

## feedbacks

* id
* order_id
* client_id
* overall_rating (Excellent / Good / Average / Poor)
* delivery_rating
* quality_rating
* staff_service_rating
* recommend (Yes / No)
* comments
* submitted_at
* created_at

---

## complaints

* id
* order_id
* client_id
* order_ref
* category
* severity
* subject
* description
* attachments (UUID[])
* assigned_to
* resolution
* status (New / In Progress / Resolved / Closed)
* sla_breached
* logged_at
* resolved_at
* created_at
* updated_at

---

## messages

* id
* sender_id
* receiver_id
* text
* is_read
* attached_file_ids (UUID[])
* sent_at
* created_at

---

## notifications

* id
* department_id
* title
* body
* icon
* color
* created_at

---

## read_notifications

* id
* user_id
* notification_id
* is_read
* read_at

---

## notes

* id
* user_id
* entity_type (client / order / site_visit / design / etc.)
* entity_id
* title
* content
* color
* pinned
* checklist (JSONB array of {text, done})
* created_at
* updated_at
