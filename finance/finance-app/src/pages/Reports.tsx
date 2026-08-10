import { useState } from 'react';
import { Calendar, Download, Search, Settings2, X } from 'lucide-react';

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
    { account_code: '1000', account_name: 'Cash', account_type: 'Asset', is_active: true, created_at: '2024-01-10' },
    { account_code: '1100', account_name: 'Accounts Receivable', account_type: 'Asset', is_active: true, created_at: '2024-01-12' },
    { account_code: '2000', account_name: 'Accounts Payable', account_type: 'Liability', is_active: true, created_at: '2024-01-14' },
    { account_code: '3000', account_name: 'Revenue', account_type: 'Revenue', is_active: true, created_at: '2024-01-16' },
  ],
  inventory: [
    { code: 'SKU001', name: 'Product A', category: 'Electronics', balance: 150, unit_cost: 25.00, reorder_level: 20, status: 'In Stock', created_at: '2024-01-11' },
    { code: 'SKU002', name: 'Product B', category: 'Furniture', balance: 200, unit_cost: 30.00, reorder_level: 30, status: 'In Stock', created_at: '2024-01-13' },
    { code: 'SKU003', name: 'Product C', category: 'Office Supplies', balance: 75, unit_cost: 45.00, reorder_level: 50, status: 'Low Stock', created_at: '2024-01-15' },
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
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [columnDropdowns, setColumnDropdowns] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, Record<string, boolean>>>({});

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

  const toggleColumnDropdown = (reportType: string) => {
    setColumnDropdowns(prev => ({ ...prev, [reportType]: !prev[reportType] }));
  };

  const toggleColumnVisibility = (reportType: string, column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [reportType]: {
        ...prev[reportType],
        [column]: !prev[reportType]?.[column]
      }
    }));
  };

  const getVisibleColumns = (reportType: string, allColumns: string[]) => {
    const visibility = columnVisibility[reportType] || {};
    return allColumns.filter(col => visibility[col] !== false);
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
      'chart-of-accounts': 'created_at',
      inventory: 'created_at',
    };
    
    const dateField = dateFieldMap[reportType];
    if (!dateField) return data;
    
    return data.filter(row => {
      const rowDate = row[dateField];
      if (!rowDate) return true;
      
      const itemDate = new Date(rowDate);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      
      return itemDate >= start && itemDate <= end;
    });
  };

  const filterDataBySearch = (data: any[], searchTerm: string) => {
    if (!searchTerm) return data;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return data.filter(row => {
      return Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        const stringValue = String(value).toLowerCase();
        return stringValue.includes(lowerSearchTerm);
      });
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
            
            const dateFilteredData = filterDataByDate(rawData, reportType);
            const searchTerm = searchTerms[reportType] || '';
            const data = filterDataBySearch(dateFilteredData, searchTerm);

            const reportConfig: Record<string, { title: string; columns: Array<{ key: string; label: string }> }> = {
              purchase: {
                title: 'Purchase Report',
                columns: [
                  { key: 'purchase_no', label: 'Purchase No' },
                  { key: 'purchase_date', label: 'Date' },
                  { key: 'purchase_type', label: 'Type' },
                  { key: 'receipt_source', label: 'Source' },
                  { key: 'reference_no', label: 'Reference No' },
                  { key: 'vat_type', label: 'VAT Type' },
                  { key: 'subtotal', label: 'Subtotal' },
                  { key: 'vat_amount', label: 'VAT' },
                  { key: 'total_amount', label: 'Total' },
                  { key: 'status', label: 'Status' },
                ],
              },
              sales: {
                title: 'Sales Report',
                columns: [
                  { key: 'sales_no', label: 'Sales No' },
                  { key: 'sales_date', label: 'Date' },
                  { key: 'customer_name', label: 'Customer' },
                  { key: 'customer_tin', label: 'Customer TIN' },
                  { key: 'sales_type', label: 'Type' },
                  { key: 'sales_category', label: 'Category' },
                  { key: 'receipt_source', label: 'Source' },
                  { key: 'vat_withholding', label: 'VAT Withholding' },
                  { key: 'cash_received', label: 'Cash Received' },
                  { key: 'subtotal', label: 'Subtotal' },
                  { key: 'vat_amount', label: 'VAT' },
                  { key: 'withholding_amount', label: 'Withholding' },
                  { key: 'total_amount', label: 'Total' },
                  { key: 'net_amount', label: 'Net Amount' },
                  { key: 'status', label: 'Status' },
                ],
              },
              'chart-of-accounts': {
                title: 'Chart of Accounts',
                columns: [
                  { key: 'account_code', label: 'Account Code' },
                  { key: 'account_name', label: 'Account Name' },
                  { key: 'account_type', label: 'Type' },
                  { key: 'is_active', label: 'Status' },
                ],
              },
              inventory: {
                title: 'Inventory Report',
                columns: [
                  { key: 'code', label: 'Item Code' },
                  { key: 'name', label: 'Item Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'balance', label: 'Balance' },
                  { key: 'unit_cost', label: 'Unit Cost' },
                  { key: 'reorder_level', label: 'Reorder Level' },
                  { key: 'status', label: 'Status' },
                ],
              },
              'general-journal': {
                title: 'General Journal',
                columns: [
                  { key: 'journal_no', label: 'Journal No' },
                  { key: 'journal_date', label: 'Date' },
                  { key: 'reference', label: 'Reference' },
                  { key: 'status', label: 'Status' },
                ],
              },
              payroll: {
                title: 'Payroll Report',
                columns: [
                  { key: 'employee_id', label: 'Employee ID' },
                  { key: 'period_start', label: 'Period Start' },
                  { key: 'period_end', label: 'Period End' },
                  { key: 'basic_salary', label: 'Basic Salary' },
                  { key: 'overtime', label: 'Overtime' },
                  { key: 'gross_salary', label: 'Gross Salary' },
                  { key: 'income_tax', label: 'Income Tax' },
                  { key: 'net_pay', label: 'Net Pay' },
                  { key: 'status', label: 'Status' },
                ],
              },
            };

            const config = reportConfig[reportType];
            if (!config) return null;

            const visibleColumns = config.columns.filter(col => columnVisibility[reportType]?.[col.label] !== false);

            return (
              <div key={reportType} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerms[reportType] || ''}
                        onChange={(e) => setSearchTerms(prev => ({ ...prev, [reportType]: e.target.value }))}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => toggleColumnDropdown(reportType)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Settings2 className="w-4 h-4 text-gray-600" />
                      </button>
                      {columnDropdowns[reportType] && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Show/Hide Columns</span>
                            <button
                              onClick={() => toggleColumnDropdown(reportType)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <div className="p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
                            {config.columns.map((col) => (
                              <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={columnVisibility[reportType]?.[col.label] !== false}
                                  onChange={() => toggleColumnVisibility(reportType, col.label)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {visibleColumns.map((col) => (
                          <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((row: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {visibleColumns.map((col) => (
                            <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {typeof row[col.key] === 'number' && row[col.key] % 1 !== 0 ? `ETB ${row[col.key].toLocaleString()}` : typeof row[col.key] === 'boolean' ? (row[col.key] ? 'Active' : 'Inactive') : row[col.key]}
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
