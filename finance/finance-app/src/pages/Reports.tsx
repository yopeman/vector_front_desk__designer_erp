import { useState, useEffect, useRef, type ChangeEvent, type DragEvent, type ClipboardEvent } from 'react';
import { Calendar, Download, Search, Settings2, X } from 'lucide-react';
import { usePurchases, useSales, useGLAccounts, useJournals, usePayroll } from '../hooks/useFinance';
import { storeClient, financeClient } from '../services/supabaseClients';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface ReportFile {
  id: number;
  name: string;
  path: string;
  mime_type?: string;
  file_size?: number;
}

interface SavedReport {
  id: number;
  user_id?: string;
  department?: string;
  from_date?: string;
  to_date?: string;
  note?: string;
  attached_file_ids?: number[];
  created_at?: string;
  files: ReportFile[];
  creatorName?: string | null;
}

const mdComponents = {
  a: ({ children, ...props }: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>,
  table: ({ children, ...props }: any) => <div className="overflow-x-auto my-2"><table className="w-full border-collapse text-xs" {...props}>{children}</table></div>,
  th: ({ children, ...props }: any) => <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold" {...props}>{children}</th>,
  td: ({ children, ...props }: any) => <td className="border border-slate-200 px-2 py-1 align-top" {...props}>{children}</td>,
  code: ({ inline, children, ...props }: any) => inline
    ? <code className="bg-slate-100 text-slate-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>
    : <code {...props}>{children}</code>,
  pre: ({ children, ...props }: any) => <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2" {...props}>{children}</pre>,
  ul: ({ children, ...props }: any) => <ul className="list-disc pl-5 my-1.5" {...props}>{children}</ul>,
  ol: ({ children, ...props }: any) => <ol className="list-decimal pl-5 my-1.5" {...props}>{children}</ol>,
  blockquote: ({ children, ...props }: any) => <blockquote className="border-l-4 border-blue-500 pl-3 my-2 text-slate-600 italic" {...props}>{children}</blockquote>,
  h1: ({ children, ...props }: any) => <h1 className="text-base font-bold my-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }: any) => <h2 className="text-sm font-bold my-2" {...props}>{children}</h2>,
  h3: ({ children, ...props }: any) => <h3 className="text-sm font-semibold my-1.5" {...props}>{children}</h3>,
};

export function Reports() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [columnDropdowns, setColumnDropdowns] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Save Report
  const [activeReportTab, setActiveReportTab] = useState<'generate' | 'saved'>('generate');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [reportDept] = useState('finance');
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [reportDragActive, setReportDragActive] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [viewReport, setViewReport] = useState<SavedReport | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

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

  const openSaveReportModal = async () => {
    setReportFromDate(startDate || '');
    setReportToDate(endDate || '');
    setReportMarkdown('');
    setReportFiles([]);
    try {
      const { data: { user } } = await financeClient.auth.getUser();
      setReportUserId(user?.id || null);
    } catch (error) {
      console.error('Error getting current user:', error);
      setReportUserId(null);
    }
    setShowReportModal(true);
  };

  const addReportFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    setReportFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const unique = incoming.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
      return [...prev, ...unique];
    });
  };

  const handleReportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addReportFiles(e.target.files);
    e.target.value = '';
  };

  const handleReportDrop = (e: DragEvent) => {
    e.preventDefault();
    setReportDragActive(false);
    addReportFiles(e.dataTransfer.files);
  };

  const handleReportDragOver = (e: DragEvent) => {
    e.preventDefault();
    setReportDragActive(true);
  };

  const handleReportDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setReportDragActive(false);
  };

  const handleReportPaste = (e: ClipboardEvent) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      addReportFiles(files);
    }
  };

  const uploadReportFile = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await financeClient.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: fileRecord, error: insertError } = await financeClient
      .from('files')
      .insert({
        name: file.name,
        path: data.path,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: reportUserId
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return fileRecord.id;
  };

  const handleSaveReport = async () => {
    if (!reportUserId) {
      alert('Could not determine current user. Please sign in and try again.');
      return;
    }
    if (!reportFromDate || !reportToDate) {
      alert('From date and To date are required.');
      return;
    }
    if (!reportMarkdown.trim()) {
      alert('Please enter the report content.');
      return;
    }

    setReportSaving(true);
    try {
      const fileIds: number[] = [];
      for (const file of reportFiles) {
        try {
          const fileId = await uploadReportFile(file);
          fileIds.push(fileId);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          alert(`Failed to upload file: ${file.name}`);
        }
      }

      const { error } = await financeClient
        .from('report_captions')
        .insert({
          user_id: reportUserId,
          department: reportDept,
          from_date: reportFromDate,
          to_date: reportToDate,
          note: reportMarkdown,
          attached_file_ids: fileIds
        });

      if (error) throw error;

      alert('Report saved successfully.');
      setShowReportModal(false);
      fetchSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setReportSaving(false);
    }
  };

  const fetchSavedReports = async () => {
    setReportsLoading(true);
    try {
      const { data, error } = await financeClient
        .from('report_captions')
        .select('*')
        .eq('department', 'finance')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportIds = (data || []).flatMap((r: any) => r.attached_file_ids || []);
      let fileMap: Record<number, ReportFile> = {};
      let userMap: Record<string, string> = {};

      if (reportIds.length > 0) {
        const { data: files } = await financeClient
          .from('files')
          .select('id, name, path, mime_type, file_size')
          .in('id', reportIds);
        fileMap = Object.fromEntries((files || []).map((f: any) => [f.id, f]));
      }

      const creatorIds = (data || []).map((r: any) => r.user_id).filter(Boolean);
      if (creatorIds.length > 0) {
        const { data: creators } = await financeClient
          .from('users')
          .select('id, username')
          .in('id', creatorIds);
        userMap = Object.fromEntries((creators || []).map((u: any) => [u.id, u.username]));
      }

      setSavedReports((data || []).map((r: any) => ({
        ...r,
        files: (r.attached_file_ids || []).map((id: number) => fileMap[id]).filter(Boolean),
        creatorName: userMap[r.user_id] || null
      })));
    } catch (error) {
      console.error('Error fetching saved reports:', error);
      setSavedReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const switchReportTab = (tab: 'generate' | 'saved') => {
    setActiveReportTab(tab);
    if (tab === 'saved') {
      fetchSavedReports();
    }
  };

  const openReportInGenerate = (report: SavedReport) => {
    setStartDate(report.from_date || '');
    setEndDate(report.to_date || '');
    setSelectedReports(reportOptions.map(o => o.value));
    setViewReport(null);
    setActiveReportTab('generate');
  };

  const downloadReportFile = async (file: ReportFile) => {
    setDownloadingFileId(file.id);
    try {
      const { data } = await financeClient.storage
        .from('documents')
        .createSignedUrl(file.path, 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error getting file download link:', error);
      alert('Failed to get download link for: ' + file.name);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const formatReportDate = (value?: string) => {
    if (!value) return '';
    const [y, m, d] = String(value).split('-');
    if (y && m && d) {
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate financial reports</p>
        </div>
        <div className="flex items-center gap-3">
          {activeReportTab === 'generate' && (
            <button
              onClick={openSaveReportModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Save Report
            </button>
          )}
          {activeReportTab === 'generate' && (
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          )}
          {activeReportTab === 'generate' && (
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          )}
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => switchReportTab('generate')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeReportTab === 'generate'
              ? 'border-blue-600 text-blue-700 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Generate Report
        </button>
        <button
          onClick={() => switchReportTab('saved')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeReportTab === 'saved'
              ? 'border-blue-600 text-blue-700 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Saved Reports
          {savedReports.length > 0 && (
            <span className="ml-0.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-blue-600 text-white text-[10px] font-semibold leading-none">
              {savedReports.length}
            </span>
          )}
        </button>
      </div>

      {activeReportTab === 'generate' ? (
        <>

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
        </>
      ) : (
        <div>
          {reportsLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
              <Calendar className="w-8 h-8 animate-spin" />
              <span className="text-sm">Loading saved reports…</span>
            </div>
          ) : savedReports.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No saved reports yet.</p>
              <p className="text-xs text-gray-400 mt-1">Go to the <span className="font-medium text-gray-600">Generate Report</span> tab and save one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedReports.map(report => (
                <div key={report.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-start gap-4 p-4 border-b border-gray-100 bg-gray-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                          <Calendar className="w-3 h-3" />
                          {formatReportDate(report.from_date)} → {formatReportDate(report.to_date)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {report.creatorName ? `by ${report.creatorName}` : `by #${(report.user_id || '').slice(0, 8)}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Saved {new Date(report.created_at!).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {report.files.length > 0 && (
                          <span className="ml-2">{report.files.length} attachment{report.files.length > 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openReportInGenerate(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                        title="Apply this report's date range, select all reports, and open in the Generate Report tab"
                      >
                        <Calendar className="w-3 h-3" /> Open in Generate
                      </button>
                      <button
                        onClick={() => setViewReport(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Search className="w-3 h-3" /> View
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {report.note && report.note.trim() ? (
                      <div className="max-h-44 overflow-hidden relative">
                        <MDEditor.Markdown source={report.note} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No content.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !reportSaving && setShowReportModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Save Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Financial Report · Department: <span className="text-gray-700 font-medium">finance</span> · User: {reportUserId ? `#${reportUserId.slice(0, 8)}` : '(resolving…)'}
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors border-none cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={reportDept}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-100 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Report Content</label>
                <MDEditor
                  value={reportMarkdown}
                  onChange={(value) => setReportMarkdown(value || '')}
                  onPaste={handleReportPaste}
                  preview="live"
                  height={300}
                  previewOptions={{ components: mdComponents }}
                  textareaProps={{
                    placeholder: '# Report title\n\nWrite your report in Markdown…\n\n- bullet points\n- **bold** and *italic*'
                  }}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Markdown supported with live preview. You can also drag &amp; drop, select, or paste (Ctrl+V) files into the editor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Attached Files</label>
                <div
                  onDragEnter={handleReportDragOver}
                  onDragOver={handleReportDragOver}
                  onDragLeave={handleReportDragLeave}
                  onDrop={handleReportDrop}
                  onClick={() => reportFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${reportDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <input
                    ref={reportFileInputRef}
                    type="file"
                    multiple
                    onChange={handleReportFileChange}
                    className="hidden"
                  />
                  <div className="text-sm text-gray-600 mb-1">
                    Drag &amp; drop files here, click to select, or paste (Ctrl+V)
                  </div>
                  <div className="text-xs text-gray-400">Multiple files supported</div>
                </div>

                {reportFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {reportFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-500 transition-colors border-none cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={reportSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-60"
              >
                {reportSaving ? 'Saving…' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewReport(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Saved Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[11px] font-semibold">
                    <Calendar className="w-3 h-3" />
                    {formatReportDate(viewReport.from_date)} → {formatReportDate(viewReport.to_date)}
                  </span>
                  <span className="ml-2">
                    Department: <span className="text-gray-700 font-medium">finance</span>
                  </span>
                  <span className="ml-2">
                    Saved on {new Date(viewReport.created_at!).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    {viewReport.creatorName ? ` · by ${viewReport.creatorName}` : ''}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setViewReport(null)}
                className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Report Content</label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm">
                  {viewReport.note && viewReport.note.trim() ? (
                    <MDEditor.Markdown source={viewReport.note} />
                  ) : (
                    <p className="text-gray-400 text-sm">No content.</p>
                  )}
                </div>
              </div>

              {viewReport.files.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Attached Files</label>
                  <div className="space-y-2">
                    {viewReport.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          {typeof file.file_size === 'number' && (
                            <span className="text-xs text-gray-500 shrink-0">({(file.file_size / 1024).toFixed(1)} KB)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadReportFile(file)}
                          disabled={downloadingFileId === file.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setViewReport(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
