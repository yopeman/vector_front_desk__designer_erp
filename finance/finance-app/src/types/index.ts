// Finance Database Types
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type PurchaseType = 'Cash' | 'Credit';
export type SalesType = 'Cash' | 'Credit';
export type VatType = 'VAT' | 'Exempted';
export type ReceiptSource = 'Manual' | 'FS';
export type VatWithholding = 'No Withholding' | '3%' | '7.5%' | '30%';
export type JournalStatus = 'Draft' | 'Posted';
export type PayrollStatus = 'Draft' | 'Approved' | 'Paid';

export interface GLAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Purchase {
  id: string;
  purchase_no: string;
  purchase_type: PurchaseType;
  seller_tin: string | null;
  seller_name: string;
  seller_id: string | null;
  purchase_date: string;
  receipt_source: ReceiptSource;
  reference_no: string | null;
  gl_account_id: string;
  vat_type: VatType;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_id: string | null;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  gl_account_id: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  sales_no: string;
  sales_type: SalesType;
  sales_category: string;
  cash_received: number;
  customer_tin: string | null;
  customer_name: string;
  customer_id: string | null;
  sales_date: string;
  receipt_source: ReceiptSource;
  vat_withholding: VatWithholding;
  subtotal: number;
  vat_amount: number;
  withholding_amount: number;
  total_amount: number;
  net_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SalesItem {
  id: string;
  sales_id: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  gl_account_id: string | null;
  created_at: string;
}

export interface Journal {
  id: string;
  journal_no: string;
  journal_date: string;
  reference: string | null;
  description: string | null;
  status: JournalStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface JournalLine {
  id: string;
  journal_id: string;
  gl_account_id: string;
  description: string | null;
  debit: number;
  credit: number;
  created_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  basic_salary: number;
  transport_allowance: number;
  telephone_allowance: number;
  overtime: number;
  other_earnings: number;
  gross_salary: number;
  taxable_salary: number;
  income_tax: number;
  pension_employee: number;
  pension_employer: number;
  total_deductions: number;
  net_pay: number;
  status: PayrollStatus;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TaxRate {
  id: string;
  tax_type: string;
  rate: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
}

// Sync Log Types
export interface FinanceSyncLog {
  id: string;
  source_type: 'store' | 'frontdesk' | 'hr';
  source_id: string;
  sync_type: 'purchase' | 'sale' | 'payroll';
  synced_at: string;
  period_start: string | null;
  period_end: string | null;
  status: 'success' | 'failed';
  error_message: string | null;
}

// External Database Types (for reference)
export interface StoreGRV {
  id: string;
  grv_code: string;
  date: string;
  invoice_no: string | null;
  supplier_id: string | null;
  stock_item_id: string | null;
  item_name: string;
  description: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  vat_amount: number;
  without_vat_total: number;
  with_vat_total: number;
  status: string;
  synced_to_finance: boolean | null;
}

export interface StoreSupplier {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
}

export interface StoreStockItem {
  id: string;
  code: string;
  name: string;
  category: string;
  balance: number;
  unit_cost: number;
  reorder_level: number;
}

export interface FrontdeskInvoice {
  id: string;
  invoice_no: string;
  order_id: string;
  invoice_type: string;
  issue_date: string;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  paid_amount: number;
  balance: number;
  status: string;
  synced_to_finance: boolean | null;
}

export interface FrontdeskClient {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  tin: string | null;
}

export interface FrontdeskOrderItem {
  id: string;
  order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface HREmployee {
  id: string;
  employee_id: string;
  full_name: string;
  salary: number;
  employment_status: string;
  department: string | null;
  transport_allowance: number | null;
  telephone_allowance: number | null;
}

export interface HROvertimeRecord {
  id: string;
  employee_id: string;
  work_date: string;
  overtime_hours: number;
  overtime_amount: number;
  status: string;
}
