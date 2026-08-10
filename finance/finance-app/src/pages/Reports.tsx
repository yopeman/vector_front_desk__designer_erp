import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';

// Mock data for each report type
const mockData: Record<string, any[]> = {
  purchase: [
    { purchase_no: 'PO001', purchase_date: '2024-01-15', purchase_type: 'Local', receipt_source: 'POS', reference_no: 'REF-001', vat_type: 'VAT Inclusive', subtotal: 2272.73, vat_amount: 227.27, total_amount: 2500.00, status: 'Received' },
    { purchase_no: 'PO002', purchase_date: '2024-01-18', purchase_type: 'Import', receipt_source: 'Manual', reference_no: 'REF-002', vat_type: 'VAT Exclusive', subtotal: 1636.36, vat_amount: 163.64, total_amount: 1800.00, status: 'Pending' },
    { purchase_no: 'PO003', purchase_date: '2024-01-20', purchase_type: 'Local', receipt_source: 'POS', reference_no: 'REF-003', vat_type: 'VAT Inclusive', subtotal: 3818.18, vat_amount: 381.82, total_amount: 4200.00, status: 'Received' },
  ],
  sales: [
    { sales_no: 'SO001', sales_date: '2024-01-15', customer_name: 'Client A', customer_tin: 'TIN001', sales_type: 'Cash', sales_category: 'Retail', receipt_source: 'POS', vat_withholding: 'Yes', cash_received: 1500.00, subtotal: 1363.64, vat_amount: 136.36, withholding_amount: 0.00, total_amount: 1500.00, net_amount: 1500.00, status: 'Completed' },
    { sales_no: 'SO002', sales_date: '2024-01-17', customer_name: 'Client B', customer_tin: 'TIN002', sales_type: 'Credit', sales_category: 'Wholesale', receipt_source: 'Manual', vat_withholding: 'No', cash_received: 0.00, subtotal: 2909.09, vat_amount: 290.91, withholding_amount: 0.00, total_amount: 3200.00, net_amount: 3200.00, status: 'Completed' },
    { sales_no: 'SO003', sales_date: '2024-01-19', customer_name: 'Client C', customer_tin: 'TIN003', sales_type: 'Cash', sales_category: 'Retail', receipt_source: 'POS', vat_withholding: 'Yes', cash_received: 800.00, subtotal: 727.27, vat_amount: 72.73, withholding_amount: 0.00, total_amount: 800.00, net_amount: 800.00, status: 'Pending' },
  ],
  'chart-of-accounts': [
    { account_code: '1000', account_name: 'Cash', account_type: 'Asset', is_active: true },
    { account_code: '1100', account_name: 'Accounts Receivable', account_type: 'Asset', is_active: true },
    { account_code: '2000', account_name: 'Accounts Payable', account_type: 'Liability', is_active: true },
    { account_code: '3000', account_name: 'Revenue', account_type: 'Revenue', is_active: true },
  ],
  inventory: [
    { code: 'SKU001', name: 'Product A', category: 'Electronics', balance: 150, unit_cost: 25.00, reorder_level: 20, status: 'In Stock' },
    { code: 'SKU002', name: 'Product B', category: 'Furniture', balance: 200, unit_cost: 30.00, reorder_level: 30, status: 'In Stock' },
    { code: 'SKU003', name: 'Product C', category: 'Office Supplies', balance: 75, unit_cost: 45.00, reorder_level: 50, status: 'Low Stock' },
  ],
  'general-journal': [
    { journal_no: 'JNL-001', journal_date: '2024-01-15', reference: 'REF-001', status: 'Posted' },
    { journal_no: 'JNL-002', journal_date: '2024-01-16', reference: 'REF-002', status: 'Draft' },
    { journal_no: 'JNL-003', journal_date: '2024-01-17', reference: 'REF-003', status: 'Posted' },
  ],
  payroll: [
    { employee_id: 'EMP001', period_start: '2024-01-01', period_end: '2024-01-31', basic_salary: 5000.00, overtime: 500.00, gross_salary: 5500.00, income_tax: 275.00, net_pay: 5225.00, status: 'Paid' },
    { employee_id: 'EMP002', period_start: '2024-01-01', period_end: '2024-01-31', basic_salary: 4500.00, overtime: 300.00, gross_salary: 4800.00, income_tax: 240.00, net_pay: 4560.00, status: 'Approved' },
    { employee_id: 'EMP003', period_start: '2024-01-01', period_end: '2024-01-31', basic_salary: 6000.00, overtime: 800.00, gross_salary: 6800.00, income_tax: 340.00, net_pay: 6460.00, status: 'Draft' },
  ],
};

export function Reports() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const reportOptions = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'sales', label: 'Sales' },
    { value: 'chart-of-accounts', label: 'Chart of Accounts' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'general-journal', label: 'General Journal' },
    { value: 'payroll', label: 'Payroll' },
  ];

  const handleReportToggle = (value: string) => {
    setSelectedReports(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerateReport = () => {
    // Report generation will be implemented with actual data queries
    console.log('Generating report:', { selectedReports, startDate, endDate });
  };

  const filterDataByDate = (data: any[], reportType: string) => {
    if (!startDate && !endDate) return data;
    
    const dateFieldMap: Record<string, string> = {
      purchase: 'purchase_date',
      sales: 'sales_date',
      'general-journal': 'journal_date',
      payroll: 'period_start',
    };
    
    const dateField = dateFieldMap[reportType];
    if (!dateField) return data; // Chart of accounts and inventory don't have date fields
    
    return data.filter(row => {
      const rowDate = row[dateField];
      if (!rowDate) return true;
      
      const itemDate = new Date(rowDate);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      
      return itemDate >= start && itemDate <= end;
    });
  };

  const handleExportPDF = () => {
    // PDF export will be implemented with jsPDF
    console.log('Exporting to PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate financial reports</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left min-w-[200px]"
            >
              {selectedReports.length > 0
                ? `${selectedReports.length} selected`
                : 'Select reports'}
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-3 flex flex-col gap-2">
                {reportOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={selectedReports.includes(option.value)}
                      onChange={() => handleReportToggle(option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-5"
          >
            <Calendar className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Display */}
      {selectedReports.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Select report type to generate</p>
            <p className="text-sm mt-2">Financial reports will be displayed here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedReports.map(reportType => {
            const rawData = mockData[reportType];
            if (!rawData || rawData.length === 0) return null;
            
            const data = filterDataByDate(rawData, reportType);

            const reportConfig: Record<string, { title: string; columns: string[] }> = {
              purchase: {
                title: 'Purchase Report',
                columns: ['Purchase No', 'Date', 'Type', 'Source', 'Reference No', 'VAT Type', 'Subtotal', 'VAT', 'Total', 'Status'],
              },
              sales: {
                title: 'Sales Report',
                columns: ['Sales No', 'Date', 'Customer', 'Customer TIN', 'Type', 'Category', 'Source', 'VAT Withholding', 'Cash Received', 'Subtotal', 'VAT', 'Withholding', 'Total', 'Net Amount', 'Status'],
              },
              'chart-of-accounts': {
                title: 'Chart of Accounts',
                columns: ['Account Code', 'Account Name', 'Type', 'Status'],
              },
              inventory: {
                title: 'Inventory Report',
                columns: ['Item Code', 'Item Name', 'Category', 'Balance', 'Unit Cost', 'Reorder Level', 'Status'],
              },
              'general-journal': {
                title: 'General Journal',
                columns: ['Journal No', 'Date', 'Reference', 'Status'],
              },
              payroll: {
                title: 'Payroll Report',
                columns: ['Employee ID', 'Period Start', 'Period End', 'Basic Salary', 'Overtime', 'Gross Salary', 'Income Tax', 'Net Pay', 'Status'],
              },
            };

            const config = reportConfig[reportType];
            if (!config) return null;

            return (
              <div key={reportType} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {config.columns.map((col) => (
                          <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((row: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {typeof value === 'number' && value % 1 !== 0 ? `ETB ${value.toLocaleString()}` : typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
