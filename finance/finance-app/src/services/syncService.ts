import { financeClient, storeClient, frontdeskClient, hrClient } from './supabaseClients';
import type { 
  Purchase, 
  PurchaseItem, 
  Sale, 
  SalesItem, 
  Payroll, 
  FinanceSyncLog,
  StoreGRV,
  StoreSupplier,
  StoreStockItem,
  FrontdeskInvoice,
  FrontdeskClient,
  FrontdeskOrderItem,
  HREmployee,
  HROvertimeRecord
} from '../types';

// Helper: Check if record was already synced
async function isAlreadySynced(sourceType: string, sourceId: string): Promise<boolean> {
  const { data, error } = await financeClient
    .from('finance_sync_log')
    .select('id')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('status', 'success')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking sync status:', error);
  }

  return !!data;
}

// Helper: Log sync attempt
async function logSync(
  sourceType: string,
  sourceId: string,
  syncType: string,
  status: 'success' | 'failed',
  errorMessage: string | null = null,
  periodStart: string | null = null,
  periodEnd: string | null = null
): Promise<void> {
  await financeClient.from('finance_sync_log').insert({
    source_type: sourceType,
    source_id: sourceId,
    sync_type: syncType,
    synced_at: new Date().toISOString(),
    period_start: periodStart,
    period_end: periodEnd,
    status,
    error_message: errorMessage
  });
}

// Store → Purchases Sync
export async function syncPurchasesFromStore(): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  try {
    // Fetch GRVs that are received and not synced
    const { data: grvs, error: grvError } = await storeClient
      .from('goods_receiving_vouchers')
      .select(`
        id,
        grv_code,
        date,
        invoice_no,
        supplier_id,
        stock_item_id,
        item_name,
        description,
        unit,
        quantity,
        unit_price,
        vat_amount,
        without_vat_total,
        with_vat_total,
        status
      `)
      .eq('status', 'received')
      .order('date', { ascending: false });

    if (grvError) {
      throw new Error(`Failed to fetch GRVs: ${grvError.message}`);
    }

    if (!grvs || grvs.length === 0) {
      return results;
    }

    // Fetch suppliers to map supplier names
    const { data: suppliers } = await storeClient
      .from('suppliers')
      .select('id, company_name');

    const supplierMap = new Map(
      suppliers?.map(s => [s.id, s.company_name]) || []
    );

    // Get default purchase GL account (use any Liability account for purchases)
    let { data: glAccount } = await financeClient
      .from('finance_gl_accounts')
      .select('id')
      .eq('account_type', 'Liability')
      .limit(1)
      .maybeSingle();

    let defaultGlAccountId = glAccount?.id;

    // If no Liability account exists, create a default one
    if (!defaultGlAccountId) {
      const { data: newAccount, error: accountError } = await financeClient
        .from('finance_gl_accounts')
        .insert({
          account_code: '2000',
          account_name: 'Accounts Payable',
          account_type: 'Liability',
          description: 'Money owed to suppliers'
        })
        .select('id')
        .single();
      
      if (accountError) {
        console.error('Failed to create default GL account:', accountError);
        throw new Error(`Failed to create default GL account: ${accountError.message}`);
      }
      defaultGlAccountId = newAccount?.id;
    }

    if (!defaultGlAccountId) {
      throw new Error('Could not obtain or create a GL account for purchases');
    }

    for (const grv of grvs as any[]) {
      try {
        // Check if already synced
        const alreadySynced = await isAlreadySynced('store', grv.id);
        if (alreadySynced) {
          continue;
        }

        // Generate purchase number
        const purchaseNo = `PO-${grv.grv_code}`;

        // Create purchase header
        const purchase: Partial<Purchase> = {
          purchase_no: purchaseNo,
          purchase_type: 'Credit',
          seller_tin: null,
          seller_name: grv.supplier_id ? supplierMap.get(grv.supplier_id) || 'Unknown Supplier' : 'Unknown Supplier',
          seller_id: grv.supplier_id,
          purchase_date: grv.date,
          receipt_source: 'Manual',
          reference_no: grv.invoice_no,
          gl_account_id: defaultGlAccountId || null,
          vat_type: 'VAT',
          subtotal: grv.without_vat_total || 0,
          vat_amount: grv.vat_amount || 0,
          total_amount: grv.with_vat_total || 0,
          status: 'Draft',
          notes: grv.description
        };

        const { data: purchaseData, error: purchaseError } = await financeClient
          .from('finance_purchases')
          .insert(purchase)
          .select('id')
          .single();

        if (purchaseError) {
          console.error('Purchase insert error:', purchaseError);
          console.error('Purchase data being inserted:', purchase);
          throw new Error(`Failed to create purchase: ${purchaseError.message}`);
        }

        // Create purchase item
        const purchaseItem: Partial<PurchaseItem> = {
          purchase_id: purchaseData.id,
          item_id: grv.stock_item_id,
          item_name: grv.item_name,
          description: grv.description,
          quantity: grv.quantity,
          unit_price: grv.unit_price,
          gl_account_id: defaultGlAccountId || null
        };

        const { error: itemError } = await financeClient
          .from('finance_purchase_items')
          .insert(purchaseItem);

        if (itemError) {
          throw new Error(`Failed to create purchase item: ${itemError.message}`);
        }

        // Log successful sync
        await logSync('store', grv.id, 'purchase', 'success');
        results.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`GRV ${grv.grv_code}: ${errorMessage}`);
        await logSync('store', grv.id, 'purchase', 'failed', errorMessage);
        results.failed++;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Sync failed: ${errorMessage}`);
  }

  return results;
}

// Frontdesk → Sales Sync
export async function syncSalesFromFrontdesk(): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  try {
    // Fetch invoices that are paid/approved and not synced with client information
    const { data: invoices, error: invoiceError } = await frontdeskClient
      .from('invoices')
      .select(`
        id,
        invoice_no,
        order_id,
        invoice_type,
        issue_date,
        subtotal,
        vat_amount,
        grand_total,
        paid_amount,
        balance,
        status,
        orders!inner (
          client_id,
          clients (
            name,
            tin
          )
        )
      `)
      .in('status', ['Paid', 'Partially Paid'])
      .order('issue_date', { ascending: false });

    if (invoiceError) {
      throw new Error(`Failed to fetch invoices: ${invoiceError.message}`);
    }

    if (!invoices || invoices.length === 0) {
      return results;
    }

    // Get default sales GL account
    const { data: glAccount } = await financeClient
      .from('finance_gl_accounts')
      .select('id')
      .eq('account_code', 'SALES_REVENUE')
      .maybeSingle();

    const defaultGlAccountId = glAccount?.id;

    for (const invoice of invoices as any[]) {
      try {
        // Check if already synced
        const alreadySynced = await isAlreadySynced('frontdesk', invoice.id);
        if (alreadySynced) {
          continue;
        }

        // Generate sales number
        const salesNo = `SL-${invoice.invoice_no}`;

        // Create sales header
        const sale: Partial<Sale> = {
          sales_no: salesNo,
          sales_type: 'Cash',
          sales_category: invoice.invoice_type || 'Goods',
          cash_received: invoice.paid_amount,
          customer_tin: invoice.orders?.clients?.tin || null,
          customer_name: invoice.orders?.clients?.name || 'Unknown Customer',
          customer_id: invoice.orders?.client_id || null,
          sales_date: invoice.issue_date,
          receipt_source: 'Manual',
          vat_withholding: 'No Withholding',
          subtotal: invoice.subtotal,
          vat_amount: invoice.vat_amount,
          withholding_amount: 0,
          total_amount: invoice.grand_total,
          net_amount: invoice.grand_total,
          status: 'Draft'
        };

        const { data: salesData, error: salesError } = await financeClient
          .from('finance_sales')
          .insert(sale)
          .select('id')
          .single();

        if (salesError) {
          throw new Error(`Failed to create sale: ${salesError.message}`);
        }

        // Fetch order items
        const { data: orderItems, error: itemsError } = await frontdeskClient
          .from('order_items')
          .select('*')
          .eq('order_id', invoice.order_id);

        if (itemsError) {
          throw new Error(`Failed to fetch order items: ${itemsError.message}`);
        }

        // Create sales items
        if (orderItems && orderItems.length > 0) {
          const salesItems = orderItems.map((item: any) => ({
            sales_id: salesData.id,
            item_id: item.id,
            item_name: item.description || 'Item',
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: 15.00,
            gl_account_id: defaultGlAccountId
          }));

          const { error: insertItemsError } = await financeClient
            .from('finance_sales_items')
            .insert(salesItems);

          if (insertItemsError) {
            throw new Error(`Failed to create sales items: ${insertItemsError.message}`);
          }
        }

        // Log successful sync
        await logSync('frontdesk', invoice.id, 'sale', 'success');
        results.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Invoice ${invoice.invoice_no}: ${errorMessage}`);
        await logSync('frontdesk', invoice.id, 'sale', 'failed', errorMessage);
        results.failed++;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Sync failed: ${errorMessage}`);
  }

  return results;
}

// Ethiopian Progressive Tax Calculator
function calculateIncomeTax(taxableSalary: number): number {
  const brackets = [
    { min: 0, max: 6000, rate: 0 },
    { min: 6001, max: 16500, rate: 0.10 },
    { min: 16501, max: 32000, rate: 0.15 },
    { min: 32001, max: 52500, rate: 0.20 },
    { min: 52501, max: 77000, rate: 0.25 },
    { min: 77001, max: 109500, rate: 0.30 },
    { min: 109501, max: Infinity, rate: 0.35 }
  ];

  let tax = 0;
  let remainingSalary = taxableSalary;

  for (const bracket of brackets) {
    if (remainingSalary <= 0) break;

    const taxableInBracket = Math.min(remainingSalary, bracket.max - bracket.min + 1);
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
      remainingSalary -= taxableInBracket;
    }
  }

  return Math.round(tax * 100) / 100;
}

// HR → Payroll Sync
export async function syncPayrollFromHR(year: number, month: number): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  try {
    // Calculate period dates
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    // Fetch active employees
    const { data: employees, error: employeeError } = await hrClient
      .from('employees')
      .select('*')
      .eq('employment_status', 'Active');

    if (employeeError) {
      throw new Error(`Failed to fetch employees: ${employeeError.message}`);
    }

    if (!employees || employees.length === 0) {
      return results;
    }

    for (const employee of employees) {
      try {
        // Check if payroll already exists for this employee and period
        const { data: existingPayroll } = await financeClient
          .from('finance_payroll')
          .select('id')
          .eq('employee_id', employee.id)
          .eq('period_start', periodStart.toISOString().split('T')[0])
          .eq('period_end', periodEnd.toISOString().split('T')[0])
          .maybeSingle();

        if (existingPayroll) {
          continue; // Skip if already processed
        }

        // Fetch overtime records for the period
        const { data: overtimeRecords } = await hrClient
          .from('overtime_records')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('work_date', periodStart.toISOString().split('T')[0])
          .lte('work_date', periodEnd.toISOString().split('T')[0])
          .eq('status', 'Approved');

        // Calculate overtime total
        const overtimeTotal = overtimeRecords?.reduce((sum, record) => 
          sum + (record.overtime_amount || 0), 0) || 0;

        // Extract salary and allowances
        const basicSalary = employee.salary || 0;
        const transportAllowance = employee.transport_allowance || 0;
        const telephoneAllowance = employee.telephone_allowance || 0;
        const otherEarnings = 0; // Can be extended

        // Calculate gross salary
        const grossSalary = basicSalary + transportAllowance + telephoneAllowance + overtimeTotal + otherEarnings;

        // Calculate taxable salary (excluding non-taxable allowances)
        const taxableSalary = grossSalary - transportAllowance - telephoneAllowance;

        // Calculate income tax
        const incomeTax = calculateIncomeTax(taxableSalary);

        // Calculate pension
        const pensionEmployee = basicSalary * 0.07;
        const pensionEmployer = basicSalary * 0.11;

        // Calculate total deductions and net pay
        const totalDeductions = incomeTax + pensionEmployee;
        const netPay = grossSalary - totalDeductions;

        // Create payroll record
        const payroll: Partial<Payroll> = {
          employee_id: employee.id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          basic_salary: basicSalary,
          transport_allowance: transportAllowance,
          telephone_allowance: telephoneAllowance,
          overtime: overtimeTotal,
          other_earnings: otherEarnings,
          taxable_salary: taxableSalary,
          income_tax: incomeTax,
          pension_employee: pensionEmployee,
          pension_employer: pensionEmployer,
          total_deductions: totalDeductions,
          net_pay: netPay,
          status: 'Draft'
        };

        const { error: payrollError } = await financeClient
          .from('finance_payroll')
          .insert(payroll);

        if (payrollError) {
          throw new Error(`Failed to create payroll: ${payrollError.message}`);
        }

        // Log successful sync
        await logSync('hr', employee.id, 'payroll', 'success', null, 
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0]
        );
        results.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Employee ${employee.full_name}: ${errorMessage}`);
        await logSync('hr', employee.id, 'payroll', 'failed', errorMessage,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0]
        );
        results.failed++;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Sync failed: ${errorMessage}`);
  }

  return results;
}
