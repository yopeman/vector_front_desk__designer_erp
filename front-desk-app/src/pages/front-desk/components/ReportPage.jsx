import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const menuItems = [
  { 
    name: 'CRM',
    submenu: [
      { name: 'Leads', icon: 'fa-user-tag' },
      { name: 'Clients', icon: 'fa-user-check' },
      { name: 'Site Visits', icon: 'fa-location-dot' },
      { name: 'Items', icon: 'fa-archive' },
      { name: 'Orders', icon: 'fa-box' },
    ] 
  },
  {
    name: 'Design',
    submenu: [
      { name: 'Designs', icon: 'fa-file-code' },
      { name: 'Design Status', icon: 'fa-spinner' },
    ]
  },
  { 
    name: 'Sales', 
    submenu: [
      { name: 'Proforma Invoices', icon: 'fa-flask' },
      { name: 'Sales Invoices', icon: 'fa-file-invoice' },
      { name: 'Payments', icon: 'fa-credit-card' },
      { name: 'Sales Invoices Status', icon: 'fa-file-invoice-dollar' },
    ] 
  },
  { 
    name: 'Production', 
    submenu: [
      { name: 'Job Orders', icon: 'fa-clipboard-list' },
    ] 
  },
  { 
    name: 'Logistics & Installation', 
    submenu: [
      { name: 'Delivery', icon: 'fa-truck-fast' },
      { name: 'Installation', icon: 'fa-screwdriver-wrench' }
    ] 
  },
  { 
    name: 'Customer Care', 
    submenu: [
      { name: 'Feedback', icon: 'fa-comments' },
      { name: 'Complaints', icon: 'fa-triangle-exclamation' },
      { name: 'Warranty', icon: 'fa-shield-halved' }
    ] 
  },
];

export default function ReportPage() {
  const [selectedSubmenus, setSelectedSubmenus] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableColumnVisibility, setTableColumnVisibility] = useState({});
  const [tableSearchQueries, setTableSearchQueries] = useState({});
  const [tableCurrentPages, setTableCurrentPages] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showReportDropdown, setShowReportDropdown] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [reportDept] = useState('frontdesk');
  const [reportUserId, setReportUserId] = useState(null);
  const [reportFiles, setReportFiles] = useState([]);
  const [reportDragActive, setReportDragActive] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const reportFileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedSubmenus, fromDate, toDate]);

  // Reset page to 1 when search query changes for a table
  useEffect(() => {
    Object.keys(tableSearchQueries).forEach(submenu => {
      if (tableSearchQueries[submenu] !== undefined) {
        setCurrentPage(submenu, 1);
      }
    });
  }, [tableSearchQueries]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let allData = [];

      for (const submenu of selectedSubmenus) {
        let tableName = getTableName(submenu);
        let selectFields = getSelectFields(submenu);
        let dateField = getDateField(submenu);

        if (!tableName) continue;

        let query = supabase
          .from(tableName)
          .select(selectFields)
          .order(dateField, { ascending: false });

        // Apply specific filters based on submenu
        if (submenu === 'Design Status') {
          query = query.eq('status', 'In Progress');
        }
        if (submenu === 'Leads') {
          query = query.eq('client_type', 'lead');
        }
        if (submenu === 'Clients') {
          query = query.eq('client_type', 'client');
        }
        if (submenu === 'Sales Invoices') {
          query = query.eq('invoice_type', 'Proforma');
        }
        if (submenu === 'Sales Invoices Status') {
          query = query.eq('invoice_type', 'Sales Invoice');
        }

        if (fromDate && dateField) {
          query = query.gte(dateField, fromDate);
        }
        if (toDate && dateField) {
          query = query.lte(dateField, toDate);
        }

        const { data: result, error } = await query;

        if (error) throw error;

        // Add submenu info to each record
        const dataWithSource = (result || []).map(item => ({
          ...item,
          _source: submenu
        }));

        allData = [...allData, ...dataWithSource];

        // Initialize per-table column visibility
        const columns = getColumns(submenu);
        if (!tableColumnVisibility[submenu]) {
          tableColumnVisibility[submenu] = {};
          columns.forEach(col => {
            tableColumnVisibility[submenu][col.key] = true;
          });
        }
      }

      setData(allData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getTableName = (submenu) => {
    const tableMap = {
      'Leads': 'clients',
      'Clients': 'clients',
      'Site Visits': 'site_visits',
      'Items': 'items',
      'Orders': 'orders',
      'Designs': 'designs',
      'Design Status': 'designs',
      'Proforma Invoices': 'test_proforma_invoices',
      'Sales Invoices': 'invoices',
      'Sales Invoices Status': 'invoices',
      'Payments': 'payments',
      'Job Orders': 'job_orders',
      'Delivery': 'deliveries',
      'Installation': 'installations',
      'Feedback': 'feedbacks',
      'Complaints': 'complaints',
      'Warranty': 'warranties',
    };
    return tableMap[submenu];
  };

  const getSelectFields = (submenu) => {
    const fieldMap = {
      'Leads': '*, client_type',
      'Clients': '*, client_type',
      'Site Visits': '*',
      'Items': '*',
      'Orders': '*, client:clients(name)',
      'Designs': '*',
      'Design Status': '*, order:orders(order_no), assigned_designer:users(username), design_versions(*)',
      'Proforma Invoices': '*',
      'Sales Invoices': '*, order:orders(order_no, client:clients(name))',
      'Sales Invoices Status': '*, order:orders(order_no, client:clients(name))',
      'Payments': '*, invoice:invoices(invoice_no), client:clients(name)',
      'Job Orders': '*',
      'Delivery': '*',
      'Installation': '*',
      'Feedback': '*',
      'Complaints': '*',
      'Warranty': '*',
    };
    return fieldMap[submenu] || '*';
  };

  const getDateField = (submenu) => {
    const dateMap = {
      'Leads': 'created_at',
      'Clients': 'created_at',
      'Site Visits': 'created_at',
      'Items': 'created_at',
      'Orders': 'order_date',
      'Designs': 'created_at',
      'Design Status': 'created_at',
      'Proforma Invoices': 'created_at',
      'Sales Invoices': 'issue_date',
      'Sales Invoices Status': 'issue_date',
      'Payments': 'payment_date',
      'Job Orders': 'created_at',
      'Delivery': 'scheduled_date',
      'Installation': 'scheduled_date',
      'Feedback': 'created_at',
      'Complaints': 'created_at',
      'Warranty': 'created_at',
    };
    return dateMap[submenu];
  };

  const getColumns = (submenu) => {
    const columnMap = {
      'Leads': [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'client_type', label: 'Type' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Clients': [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'client_type', label: 'Type' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Site Visits': [
        { key: 'request_no', label: 'Request No' },
        { key: 'visit_purpose', label: 'Purpose' },
        { key: 'city', label: 'City' },
        { key: 'preferred_date', label: 'Preferred Date' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Items': [
        { key: 'name', label: 'Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'unit_price', label: 'Unit Price' },
        { key: 'stock_quantity', label: 'Stock' },
      ],
      'Orders': [
        { key: 'order_no', label: 'Order No' },
        { key: 'client', label: 'Client' },
        { key: 'order_date', label: 'Order Date' },
        { key: 'total_amount', label: 'Total Amount' },
        { key: 'status', label: 'Status' },
        { key: 'sales_type', label: 'Sales Type' },
      ],
      'Designs': [
        { key: 'design_type', label: 'Design Type' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'requested_date', label: 'Requested Date' },
        { key: 'required_date', label: 'Required Date' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Design Status': [
        { key: 'order', label: 'Order No' },
        { key: 'design_type', label: 'Design Type' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'assigned_designer', label: 'Designer' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Proforma Invoices': [
        { key: 'invoice_no', label: 'Invoice No' },
        { key: 'order_no', label: 'Order No' },
        { key: 'client_name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
        { key: 'grand_total', label: 'Total' },
      ],
      'Sales Invoices': [
        { key: 'invoice_no', label: 'Invoice No' },
        { key: 'order', label: 'Order No' },
        { key: 'client', label: 'Client' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'grand_total', label: 'Total' },
        { key: 'status', label: 'Status' },
      ],
      'Sales Invoices Status': [
        { key: 'invoice_no', label: 'Invoice No' },
        { key: 'order', label: 'Order No' },
        { key: 'client', label: 'Client' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'grand_total', label: 'Total' },
        { key: 'status', label: 'Status' },
      ],
      'Payments': [
        { key: 'invoice', label: 'Invoice No' },
        { key: 'client', label: 'Client' },
        { key: 'payment_date', label: 'Payment Date' },
        { key: 'amount_paid', label: 'Amount' },
        { key: 'payment_method', label: 'Method' },
        { key: 'processing_status', label: 'Status' },
      ],
      'Job Orders': [
        { key: 'job_order_no', label: 'Job Order No' },
        { key: 'description', label: 'Description' },
        { key: 'created_at', label: 'Created Date' },
        { key: 'status', label: 'Status' },
      ],
      'Delivery': [
        { key: 'delivery_no', label: 'Delivery No' },
        { key: 'delivery_address', label: 'Delivery Address' },
        { key: 'scheduled_date', label: 'Scheduled Date' },
        { key: 'actual_delivery_time', label: 'Actual Delivery Time' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Installation': [
        { key: 'installation_no', label: 'Installation No' },
        { key: 'site_address', label: 'Site Address' },
        { key: 'scheduled_date', label: 'Scheduled Date' },
        { key: 'completion_time', label: 'Completion Time' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Feedback': [
        { key: 'client', label: 'Client' },
        { key: 'order', label: 'Order No' },
        { key: 'overall_rating', label: 'Overall Rating' },
        { key: 'recommend', label: 'Recommend' },
        { key: 'created_at', label: 'Submitted Date' },
      ],
      'Complaints': [
        { key: 'client_name', label: 'Client' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Warranty': [
        { key: 'product_name', label: 'Product' },
        { key: 'client_name', label: 'Client' },
        { key: 'claim_type', label: 'Claim Type' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
    };
    return columnMap[submenu] || [];
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const toggleTableColumn = (submenu, columnKey) => {
    setTableColumnVisibility(prev => ({
      ...prev,
      [submenu]: {
        ...(prev[submenu] || {}),
        [columnKey]: !prev[submenu]?.[columnKey]
      }
    }));
  };

  const setCurrentPage = (submenu, page) => {
    setTableCurrentPages(prev => ({
      ...prev,
      [submenu]: page
    }));
  };

  const getTotalPages = (dataLength) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  const getPaginatedData = (data, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const toggleSubmenu = (submenu) => {
    setSelectedSubmenus(prev =>
      prev.includes(submenu)
        ? prev.filter(s => s !== submenu)
        : [...prev, submenu]
    );
  };

  const handleExportPDF = () => {
    try {
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
      doc.text('Report', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`From: ${fromDate}  To: ${toDate}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Process each submenu
      selectedSubmenus.forEach((submenu, submenuIndex) => {
        const submenuData = data.filter(row => row._source === submenu);
        const columns = getColumns(submenu);

        if (submenuData.length === 0) return;

        // Add section header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${submenu} (${submenuData.length})`, leftMargin, y);
        y += 8;

        // Split data into left and right sections
        const midPoint = Math.ceil(submenuData.length / 2);
        const leftData = submenuData.slice(0, midPoint);
        const rightData = submenuData.slice(midPoint);

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

          columns.forEach(col => {
            if (leftY > pageHeight - 15) {
              doc.addPage();
              leftY = 20;
            }
            let value = getNestedValue(row, col.key);
            if (value && typeof value === 'object') {
              value = value.name || value.order_no || value.invoice_no || '';
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

          columns.forEach(col => {
            if (rightY > pageHeight - 15) {
              doc.addPage();
              rightY = 20;
            }
            let value = getNestedValue(row, col.key);
            if (value && typeof value === 'object') {
              value = value.name || value.order_no || value.invoice_no || '';
            }
            doc.setFont('helvetica', 'normal');
            doc.text(`${col.label}:`, rightMargin, rightY);
            doc.text(`${value || '-'}`, rightMargin + 35, rightY);
            rightY += 4;
          });
          rightY += 3;
        });

        // Add page break between submenus
        doc.addPage();
        y = 20;
      });

      doc.save(`Report_${selectedSubmenus.join('_').replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF: ' + error.message);
    }
  };

  const mdComponents = {
    a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>,
    table: ({ children, ...props }) => <div className="overflow-x-auto my-2"><table className="w-full border-collapse text-xs" {...props}>{children}</table></div>,
    th: ({ children, ...props }) => <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold" {...props}>{children}</th>,
    td: ({ children, ...props }) => <td className="border border-slate-200 px-2 py-1 align-top" {...props}>{children}</td>,
    code: ({ inline, children, ...props }) => inline
      ? <code className="bg-slate-100 text-slate-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>
      : <code {...props}>{children}</code>,
    pre: ({ children, ...props }) => <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2" {...props}>{children}</pre>,
    ul: ({ children, ...props }) => <ul className="list-disc pl-5 my-1.5" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="list-decimal pl-5 my-1.5" {...props}>{children}</ol>,
    blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-3 my-2 text-slate-600 italic" {...props}>{children}</blockquote>,
    h1: ({ children, ...props }) => <h1 className="text-base font-bold my-2" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="text-sm font-bold my-2" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="text-sm font-semibold my-1.5" {...props}>{children}</h3>,
  };

  const openSaveReportModal = async () => {
    setReportFromDate(fromDate || '');
    setReportToDate(toDate || '');
    setReportMarkdown('');
    setReportFiles([]);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setReportUserId(user?.id || null);
    } catch (error) {
      console.error('Error getting current user:', error);
      setReportUserId(null);
    }
    setShowReportModal(true);
  };

  const addReportFiles = (list) => {
    if (!list) return;
    const incoming = Array.from(list);
    setReportFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const unique = incoming.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
      return [...prev, ...unique];
    });
  };

  const handleReportFileChange = (e) => {
    addReportFiles(e.target.files);
    e.target.value = '';
  };

  const handleReportDrop = (e) => {
    e.preventDefault();
    setReportDragActive(false);
    addReportFiles(e.dataTransfer.files);
  };

  const handleReportDragOver = (e) => {
    e.preventDefault();
    setReportDragActive(true);
  };

  const handleReportDragLeave = (e) => {
    e.preventDefault();
    setReportDragActive(false);
  };

  const handleReportPaste = (e) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      addReportFiles(files);
    }
  };

  const uploadReportFile = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: fileRecord, error: insertError } = await supabase
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
      const fileIds = [];
      for (const file of reportFiles) {
        try {
          const fileId = await uploadReportFile(file);
          fileIds.push(fileId);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          alert(`Failed to upload file: ${file.name}`);
        }
      }

      const { error } = await supabase
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
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report: ' + error.message);
    } finally {
      setReportSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Reports</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={openSaveReportModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i> Save Report
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
            disabled={data.length === 0}
          >
            <i className="fa-solid fa-file-pdf"></i> Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Items Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                // Reset all tables to page 1 when items per page changes
                setTableCurrentPages({});
              }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Module/Submenu Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
        <label className="block text-xs font-medium text-slate-700 mb-1">Select Reports</label>
        <div className="relative">
          <button
            onClick={() => setShowReportDropdown(!showReportDropdown)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-left flex justify-between items-center"
          >
            <span>
              {selectedSubmenus.length === 0 
                ? 'Select reports...' 
                : `${selectedSubmenus.length} report${selectedSubmenus.length > 1 ? 's' : ''} selected`}
            </span>
            <i className={`fa-solid fa-chevron-${showReportDropdown ? 'up' : 'down'}`}></i>
          </button>
          
          {showReportDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {menuItems.map(menu => (
                  <div key={menu.name}>
                    <div className="text-sm font-semibold text-slate-800 mb-2">{menu.name}</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {menu.submenu.map(sub => (
                        <label key={sub.name} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSubmenus.includes(sub.name)}
                            onChange={() => toggleSubmenu(sub.name)}
                            className="w-4 h-4 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-600">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Separate Tables for Each Module */}
      {selectedSubmenus.map(submenu => {
        const submenuData = data.filter(row => row._source === submenu);
        const columns = getColumns(submenu);
        const visibleColumnsForSubmenu = columns.filter(col => 
          tableColumnVisibility[submenu]?.[col.key] !== false
        );

        // Filter data based on table-specific search query
        const tableSearchQuery = tableSearchQueries[submenu] || '';
        const filteredSubmenuData = submenuData.filter(row => {
          if (!tableSearchQuery) return true;
          return columns.some(col => {
            let value = getNestedValue(row, col.key);
            if (value && typeof value === 'object') {
              value = value.name || value.order_no || value.invoice_no || '';
            }
            return value && String(value).toLowerCase().includes(tableSearchQuery.toLowerCase());
          });
        });

        // Pagination
        const currentPage = tableCurrentPages[submenu] || 1;
        const totalPages = getTotalPages(filteredSubmenuData.length);
        const paginatedData = getPaginatedData(filteredSubmenuData, currentPage);

        return (
          <div key={submenu} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800">{submenu} ({filteredSubmenuData.length})</h3>
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={`Search ${submenu}...`}
                    value={tableSearchQueries[submenu] || ''}
                    onChange={(e) => setTableSearchQueries(prev => ({
                      ...prev,
                      [submenu]: e.target.value
                    }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {columns.map(col => (
                    <button
                      key={col.key}
                      onClick={() => toggleTableColumn(submenu, col.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-colors ${
                        tableColumnVisibility[submenu]?.[col.key] !== false
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <i className={`fa-solid ${tableColumnVisibility[submenu]?.[col.key] !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                  {visibleColumnsForSubmenu.map(col => (
                    <th key={col.key} className="p-4 text-left text-xs font-semibold text-slate-600">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnsForSubmenu.length + 1} className="p-8 text-center text-slate-400">
                      No data found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      {visibleColumnsForSubmenu.map(col => (
                        <td key={col.key} className="p-4">
                          {renderCellValue(row, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="text-xs text-slate-600">
                  Page {currentPage} of {totalPages} ({filteredSubmenuData.length} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(submenu, currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(submenu, page)}
                        className={`px-3 py-1 rounded border text-xs cursor-pointer ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(submenu, currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

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
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Save Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Front Desk Report · Department: <span className="text-slate-700 font-medium">frontdesk</span> · User: {reportUserId ? `#${reportUserId.slice(0, 8)}` : '(resolving…)'}
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-none cursor-pointer disabled:opacity-50"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Dates + Department */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={reportDept}
                    disabled
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              {/* Markdown editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Report Content</label>
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
                <p className="text-xs text-slate-400 mt-1.5">
                  Markdown supported with live preview. You can also drag &amp; drop, select, or paste (Ctrl+V) files into the editor.
                </p>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attached Files</label>
                <div
                  onDragEnter={handleReportDragOver}
                  onDragOver={handleReportDragOver}
                  onDragLeave={handleReportDragLeave}
                  onDrop={handleReportDrop}
                  onClick={() => reportFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${reportDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                >
                  <input
                    ref={reportFileInputRef}
                    type="file"
                    multiple
                    onChange={handleReportFileChange}
                    className="hidden"
                  />
                  <div className="text-sm text-slate-600 mb-1">
                    <i className="fa-solid fa-cloud-arrow-up text-blue-500 mr-1.5"></i>
                    Drag &amp; drop files here, click to select, or paste (Ctrl+V)
                  </div>
                  <div className="text-xs text-slate-400">Multiple files supported</div>
                </div>

                {reportFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {reportFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <i className="fa-solid fa-file text-blue-500 shrink-0"></i>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-500 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-red-500 transition-colors border-none cursor-pointer"
                          title="Remove file"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={reportSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-60"
              >
                {reportSaving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Saving…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i> Save Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCellValue(row, key) {
  const value = key.split('.').reduce((acc, part) => acc && acc[part], row);
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    return value.name || value.order_no || value.invoice_no || JSON.stringify(value);
  }
  if (key.includes('amount') || key.includes('price') || key.includes('total')) {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : value;
  }
  if (key.includes('date') && value) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}
