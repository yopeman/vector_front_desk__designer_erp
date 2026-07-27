# Complete Vector Front Desk ERP Database Schema

---

## departments

* id

---

## users

* id
* department_id

---

## files

* id

---

## clients (Unified Leads + Clients)

* id
* assigned_sales_officer_id
* document_file_ids (UUID[])

---

## client_contacts

* id
* client_id

---

## site_visits

* id
* client_id

---

## items

* id

---

## orders

* id
* client_id
* sales_officer_id
* department_id
* attached_file_ids (UUID[])

---

## order_items

* id
* order_id
* item_id

---

## designs

* id
* order_id
* assigned_designer_id
* attached_file_ids (UUID[])

---

## design_versions

* id
* design_id
* file_id

---

## warranties

* id
* order_id
* order_item_id (optional – to pinpoint a specific product)
* client_id
* attached_file_ids (UUID[])

---

## invoices

* id
* order_id

---

## invoice_items

* id
* invoice_id
* item_id

---

## payments

* id
* invoice_id
* client_id

---

## job_orders

* id
* invoice_id

---

## deliveries

* id
* job_order_id
* client_id

---

## installations

* id
* job_order_id
* client_id

---

## feedbacks

* id
* order_id
* client_id

---

## complaints

* id
* order_id
* client_id
* attached_file_ids (UUID[])

---

## messages

* id
* sender_id
* receiver_id

---

## notifications

* id
* department_id

---

## read_notifications

* id
* user_id
* notification_id

---

## notes

* id
* user_id
* entity_type (client / order / site_visit / design / etc.)
* entity_id
