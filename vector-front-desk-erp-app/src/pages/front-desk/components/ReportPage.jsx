import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

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
      { name: 'Proforma Invoices', icon: 'fa-file-invoice' },
      { name: 'Payments', icon: 'fa-credit-card' },
      { name: 'Sales Invoices', icon: 'fa-file-invoice-dollar' },
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
  const [selectedSubmenus, setSelectedSubmenus] = useState(['Leads']);
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(null);
  const [showReportDropdown, setShowReportDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedSubmenus, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let allData = [];
      let allColumns = {};

      for (const submenu of selectedSubmenus) {
        let tableName = getTableName(submenu);
        let selectFields = getSelectFields(submenu);
        let dateField = getDateField(submenu);

        if (!tableName) continue;

        let query = supabase
          .from(tableName)
          .select(selectFields)
          .order(dateField, { ascending: false });

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

        // Initialize visible columns for this submenu
        const columns = getColumns(submenu);
        columns.forEach(col => {
          if (!(col.key in allColumns)) {
            allColumns[col.key] = true;
          }
        });
      }

      setData(allData);
      setVisibleColumns(allColumns);
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
      'Design Status': 'design_status',
      'Proforma Invoices': 'invoices',
      'Payments': 'payments',
      'Sales Invoices': 'invoices',
      'Job Orders': 'job_orders',
      'Delivery': 'deliveries',
      'Installation': 'installations',
      'Feedback': 'feedback',
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
      'Design Status': '*',
      'Proforma Invoices': '*, order:orders(order_no, client:clients(name))',
      'Payments': '*, invoice:invoices(invoice_no), client:clients(name)',
      'Sales Invoices': '*, order:orders(order_no, client:clients(name))',
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
      'Site Visits': 'visit_date',
      'Items': 'created_at',
      'Orders': 'order_date',
      'Designs': 'created_at',
      'Design Status': 'created_at',
      'Proforma Invoices': 'issue_date',
      'Payments': 'payment_date',
      'Sales Invoices': 'issue_date',
      'Job Orders': 'created_at',
      'Delivery': 'delivery_date',
      'Installation': 'installation_date',
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
        { key: 'client_name', label: 'Client Name' },
        { key: 'visit_date', label: 'Visit Date' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'notes', label: 'Notes' },
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
      ],
      'Designs': [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Design Status': [
        { key: 'design_name', label: 'Design Name' },
        { key: 'status', label: 'Status' },
        { key: 'updated_at', label: 'Updated Date' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Proforma Invoices': [
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
      'Sales Invoices': [
        { key: 'invoice_no', label: 'Invoice No' },
        { key: 'order', label: 'Order No' },
        { key: 'client', label: 'Client' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'grand_total', label: 'Total' },
        { key: 'status', label: 'Status' },
      ],
      'Job Orders': [
        { key: 'job_order_no', label: 'Job Order No' },
        { key: 'description', label: 'Description' },
        { key: 'created_at', label: 'Created Date' },
        { key: 'status', label: 'Status' },
      ],
      'Delivery': [
        { key: 'delivery_no', label: 'Delivery No' },
        { key: 'client_name', label: 'Client' },
        { key: 'delivery_date', label: 'Delivery Date' },
        { key: 'status', label: 'Status' },
      ],
      'Installation': [
        { key: 'installation_no', label: 'Installation No' },
        { key: 'client_name', label: 'Client' },
        { key: 'installation_date', label: 'Installation Date' },
        { key: 'status', label: 'Status' },
      ],
      'Feedback': [
        { key: 'client_name', label: 'Client' },
        { key: 'rating', label: 'Rating' },
        { key: 'comments', label: 'Comments' },
        { key: 'created_at', label: 'Created Date' },
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

  const filterData = (data) => {
    if (!searchQuery) return data;
    return data.filter(row => {
      // Get all columns from all selected submenus
      const allColumns = selectedSubmenus.flatMap(submenu => getColumns(submenu));
      return allColumns.some(col => {
        let value = getNestedValue(row, col.key);
        if (value && typeof value === 'object') {
          value = value.name || value.order_no || value.invoice_no || '';
        }
        return value && String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Report: ${selectedSubmenus.join(', ')}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`From: ${fromDate}  To: ${toDate}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      const filteredData = filterData(data);
      const allColumns = selectedSubmenus.flatMap(submenu => getColumns(submenu));
      const uniqueColumns = Array.from(new Map(allColumns.map(col => [col.key, col])).values());
      const columns = uniqueColumns.filter(col => visibleColumns[col.key]);

      // Split data into left and right sections
      const midPoint = Math.ceil(filteredData.length / 2);
      const leftData = filteredData.slice(0, midPoint);
      const rightData = filteredData.slice(midPoint);

      // Left section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Section 1', 20, y);
      y += 10;

      leftData.forEach((row, index) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Record ${index + 1}:`, 20, y);
        y += 6;

        columns.forEach(col => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          let value = getNestedValue(row, col.key);
          if (value && typeof value === 'object') {
            value = value.name || value.order_no || value.invoice_no || '';
          }
          doc.setFont('helvetica', 'normal');
          doc.text(`${col.label}: ${value || '-'}`, 25, y);
          y += 5;
        });
        y += 4;
      });

      // Right section (new page)
      doc.addPage();
      y = 20;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Section 2', 20, y);
      y += 10;

      rightData.forEach((row, index) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Record ${midPoint + index + 1}:`, 20, y);
        y += 6;

        columns.forEach(col => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          let value = getNestedValue(row, col.key);
          if (value && typeof value === 'object') {
            value = value.name || value.order_no || value.invoice_no || '';
          }
          doc.setFont('helvetica', 'normal');
          doc.text(`${col.label}: ${value || '-'}`, 25, y);
          y += 5;
        });
        y += 4;
      });

      doc.save(`Report_${selectedSubmenus.join('_').replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF: ' + error.message);
    }
  };

  const allColumns = selectedSubmenus.flatMap(submenu => getColumns(submenu));
  const uniqueColumns = Array.from(new Map(allColumns.map(col => [col.key, col])).values());
  const visibleColumnsForTable = uniqueColumns.filter(col => visibleColumns[col.key]);
  const filteredData = filterData(data);

  const toggleSubmenu = (submenu) => {
    setSelectedSubmenus(prev => 
      prev.includes(submenu) 
        ? prev.filter(s => s !== submenu)
        : [...prev, submenu]
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Reports</h2>
        <button
          onClick={handleExportPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
          disabled={data.length === 0}
        >
          <i className="fa-solid fa-file-pdf"></i> Export PDF
        </button>
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

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="text-xs font-medium text-slate-600 mb-2">Show/Hide Columns</div>
              <div className="flex flex-wrap gap-2">
                {uniqueColumns.map(col => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-colors ${
                      visibleColumns[col.key] 
                        ? 'bg-blue-100 border-blue-300 text-blue-700' 
                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <i className={`fa-solid ${visibleColumns[col.key] ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Loading data...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                {visibleColumnsForTable.map(col => (
                  <th key={col.key} className="p-4 text-left text-xs font-semibold text-slate-600">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnsForTable.length + 1} className="p-8 text-center text-slate-400">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-4 text-center">{index + 1}</td>
                    {visibleColumnsForTable.map(col => (
                      <td key={col.key} className="p-4">
                        {renderCellValue(row, col.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
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
