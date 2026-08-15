import { useState } from 'react';
import { Calendar, Download, Search, Settings2, X } from 'lucide-react';
import { usePurchases, useSales, useGLAccounts, useJournals, usePayroll } from '../hooks/useFinance';
import { storeClient } from '../services/supabaseClients';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function Reports() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [columnDropdowns, setColumnDropdowns] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch real data from APIs
  const { data: purchases, isLoading: purchasesLoading } = usePurchases(1, 1000);
  const { data: sales, isLoading: salesLoading } = useSales(1, 1000);
  const { data: accounts, isLoading: accountsLoading } = useGLAccounts();
  const { data: journals, isLoading: journalsLoading } = useJournals(1, 1000);
  const { data: payroll, isLoading: payrollLoading } = usePayroll();

  // Fetch inventory from store module
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['stock-items'],
    queryFn: async () => {
      const { data, error } = await storeClient
        .from('stock_items')
        .select('*')
        .order('category');
      if (error) throw error;
      return data;
    }
  });

  // Combine all real data
  const realData: Record<string, any[]> = {
    purchase: purchases || [],
    sales: sales || [],
    'chart-of-accounts': accounts || [],
    inventory: inventory || [],
    'general-journal': journals || [],
    payroll: payroll || [],
  };

  const isLoading = purchasesLoading || salesLoading || accountsLoading || inventoryLoading || journalsLoading || payrollLoading;

  const reportOptions = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'sales', label: 'Sales' },
    { value: 'chart-of-accounts', label: 'Chart of Accounts' },
    { value: 'general-journal', label: 'General Journal' },
    { value: 'inventory', label: 'Inventory' },
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
    try {
      if (selectedReports.length === 0) {
        alert('Please select at least one report type to export.');
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 15;
      const rightMargin = pageWidth / 2 + 10;
      const lineHeight = 7;
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Reports', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateRange = startDate && endDate 
        ? `From: ${startDate}  To: ${endDate}` 
        : 'All Records';
      doc.text(dateRange, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Process each selected report
      selectedReports.forEach((reportType) => {
        const rawData = realData[reportType];
        if (!rawData || rawData.length === 0) return;

        const dateFilteredData = filterDataByDate(rawData, reportType);
        const searchTerm = searchTerms[reportType] || '';
        const data = filterDataBySearch(dateFilteredData, searchTerm);

        if (data.length === 0) return;

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
        if (!config) return;

        const visibleColumns = config.columns.filter(col => columnVisibility[reportType]?.[col.label] !== false);

        // Add section header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${config.title} (${data.length})`, leftMargin, y);
        y += 8;

        // Split data into left and right sections
        const midPoint = Math.ceil(data.length / 2);
        const leftData = data.slice(0, midPoint);
        const rightData = data.slice(midPoint);

        // Left section
        let leftY = y;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Section 1', leftMargin, leftY);
        leftY += 6;

        leftData.forEach((row, index) => {
          if (leftY > pageHeight - 20) {
            doc.addPage();
            leftY = 20;
          }

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`Record ${index + 1}:`, leftMargin, leftY);
          leftY += 5;

          visibleColumns.forEach(col => {
            if (leftY > pageHeight - 15) {
              doc.addPage();
              leftY = 20;
            }
            let value = row[col.key];
            if (typeof value === 'number' && value % 1 !== 0) {
              value = `ETB ${value.toLocaleString()}`;
            } else if (typeof value === 'boolean') {
              value = value ? 'Active' : 'Inactive';
            }
            doc.setFont('helvetica', 'normal');
            doc.text(`${col.label}:`, leftMargin, leftY);
            doc.text(`${value || '-'}`, leftMargin + 35, leftY);
            leftY += 4;
          });
          leftY += 3;
        });

        // Right section (new page if needed)
        let rightY = y;
        if (leftY > pageHeight / 2) {
          doc.addPage();
          rightY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Section 2', rightMargin, rightY);
        rightY += 6;

        rightData.forEach((row, index) => {
          if (rightY > pageHeight - 20) {
            doc.addPage();
            rightY = 20;
          }

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`Record ${midPoint + index + 1}:`, rightMargin, rightY);
          rightY += 5;

          visibleColumns.forEach(col => {
            if (rightY > pageHeight - 15) {
              doc.addPage();
              rightY = 20;
            }
            let value = row[col.key];
            if (typeof value === 'number' && value % 1 !== 0) {
              value = `ETB ${value.toLocaleString()}`;
            } else if (typeof value === 'boolean') {
              value = value ? 'Active' : 'Inactive';
            }
            doc.setFont('helvetica', 'normal');
            doc.text(`${col.label}:`, rightMargin, rightY);
            doc.text(`${value || '-'}`, rightMargin + 35, rightY);
            rightY += 4;
          });
          rightY += 3;
        });

        // Add page break between reports
        doc.addPage();
        y = 20;
      });

      const filename = `Financial_Reports_${selectedReports.join('_')}_${startDate || 'all'}_to_${endDate || 'all'}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExportExcel = () => {
    try {
      if (selectedReports.length === 0) {
        alert('Please select at least one report type to export.');
        return;
      }

      const workbook = XLSX.utils.book_new();

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

      selectedReports.forEach((reportType) => {
        const rawData = realData[reportType];
        if (!rawData || rawData.length === 0) return;

        const dateFilteredData = filterDataByDate(rawData, reportType);
        const searchTerm = searchTerms[reportType] || '';
        const data = filterDataBySearch(dateFilteredData, searchTerm);

        if (data.length === 0) return;

        const config = reportConfig[reportType];
        if (!config) return;

        const visibleColumns = config.columns.filter(col => columnVisibility[reportType]?.[col.label] !== false);

        // Prepare data for Excel sheet
        const sheetData = data.map(row => {
          const rowData: any = {};
          visibleColumns.forEach(col => {
            let value = row[col.key];
            if (typeof value === 'boolean') {
              value = value ? 'Active' : 'Inactive';
            }
            rowData[col.label] = value;
          });
          return rowData;
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        
        // Add worksheet to workbook with sheet name
        const sheetName = config.title.replace(/\s+/g, '_').substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      const filename = `Financial_Reports_${selectedReports.join('_')}_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Error exporting Excel: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate financial reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
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
          {/* <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-5"
          >
            <Calendar className="w-4 h-4" />
            Generate Report
          </button> */}
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
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Loading reports...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedReports.map(reportType => {
            const rawData = realData[reportType];
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
