import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import DesignDetailModal from './front-desk/components/DesignDetailModal';
import ProductionOrderModal from './front-desk/components/ProductionOrderModal';
import MessagesPage from './front-desk/components/MessagesPage';
import NotificationsPage from './front-desk/components/NotificationsPage';
import NotesPage from './front-desk/components/NotesPage';
import SettingsPage from './front-desk/components/SettingsPage';
import TopHeader from './front-desk/components/TopHeader';
import './DesignerPage.css';

export default function DesignerPage() {
  const { user, profile, signOut } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview-section');
  const [clockedIn, setClockedIn] = useState(true);
  const [clockInTime, setClockInTime] = useState('08:58 AM');
  const [clockOutTime, setClockOutTime] = useState('--:-- --');
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showDesignDetailModal, setShowDesignDetailModal] = useState(false);
  const [adsSearchQuery, setAdsSearchQuery] = useState('');
  const [customerApprovalVersions, setCustomerApprovalVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [fileUrls, setFileUrls] = useState({});
  const [showProductionOrderModal, setShowProductionOrderModal] = useState(false);
  const [productionOrders, setProductionOrders] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Reports state
  const [reportDateFrom, setReportDateFrom] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [reportDateTo, setReportDateTo] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [reportSelectedModules, setReportSelectedModules] = useState([]);
  const [reportTableColumnVisibility, setReportTableColumnVisibility] = useState({});
  const [reportTableSearchQueries, setReportTableSearchQueries] = useState({});
  const [reportTableCurrentPages, setReportTableCurrentPages] = useState({});
  const [reportItemsPerPage, setReportItemsPerPage] = useState(10);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  
  // Search and filter states
  const [myTasksSearch, setMyTasksSearch] = useState('');
  const [myTasksFilter, setMyTasksFilter] = useState('all');
  const [newRequestsSearch, setNewRequestsSearch] = useState('');
  const [newRequestsFilter, setNewRequestsFilter] = useState('all');
  const [activeDesignSearch, setActiveDesignSearch] = useState('');
  const [activeDesignFilter, setActiveDesignFilter] = useState('all');
  const [customerApprovalSearch, setCustomerApprovalSearch] = useState('');
  const [productionFilesSearch, setProductionFilesSearch] = useState('');
  const [designLibrarySearch, setDesignLibrarySearch] = useState('');
  const [designLibraryFilter, setDesignLibraryFilter] = useState('all');

  useEffect(() => {
    fetchDesigns();
    fetchCustomerApprovalVersions();
    fetchMyTasks();
    fetchProductionOrders();
  }, [user?.id]);

  // Fetch unread notification count and subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('read_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
        setUnreadNotificationCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('notifications-badge-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'read_notifications'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    // Refresh data when switching sections
    if (activeSection === 'my-tasks-section') {
      fetchMyTasks();
    } else if (activeSection === 'customer-approval-section') {
      fetchCustomerApprovalVersions();
    } else if (activeSection === 'new-requests-section' ||
               activeSection === 'active-design-section' ||
               activeSection === 'production-files-section' ||
               activeSection === 'design-library-section') {
      fetchDesigns();
    } else if (activeSection === 'send-production-section') {
      fetchProductionOrders();
    }
  }, [activeSection]);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*, orders(order_no, clients(name)), assigned_designer:users(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerApprovalVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('*, designs(*, orders(order_no, clients(name)), assigned_designer:users(username)), file:files(id, name, path)')
        .in('status', ['Sent', 'Reviewed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerApprovalVersions(data || []);
    } catch (error) {
      console.error('Error fetching customer approval versions:', error);
    }
  };

  async function fetchMyTasks() {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('designs')
      .select('*, orders(order_no, clients(name)), assigned_designer:users(username)')
      .eq('assigned_designer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my tasks:', error);
      return;
    }

    if (data) {
      console.log('My tasks fetched:', data.length, 'tasks for user:', user.id);

      // Fetch attached files
      const allFileIds = data.flatMap(d => d.attached_file_ids || []);
      const { data: files } = await supabase
        .from('files')
        .select('id, name, path')
        .in('id', allFileIds);

      // Fetch design versions
      const designIds = data.map(d => d.id);
      const { data: designVersions } = await supabase
        .from('design_versions')
        .select('*, files(id, name, path)')
        .in('design_id', designIds);

      // Generate signed URLs for files
      const urls = {};
      if (files) {
        for (const file of files) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) {
              urls[file.id] = url;
            } else {
              console.warn('Failed to get URL for file:', file.id, file.path);
            }
          }
        }
      }

      // Generate signed URLs for version files
      if (designVersions) {
        for (const version of designVersions) {
          if (version.files?.path) {
            const url = await getFileUrl(version.files.path);
            if (url) {
              urls[version.files.id] = url;
            }
          }
        }
      }
      setFileUrls(urls);

      // Combine data
      const tasksWithDetails = data.map(task => ({
        ...task,
        attached_files: files?.filter(f => (task.attached_file_ids || []).includes(f.id)) || [],
        design_versions: designVersions?.filter(v => v.design_id === task.id) || []
      }));
      
      setMyTasks(tasksWithDetails);
    }
  }

  const fetchProductionOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*, orders(order_no, clients(name)), machines(name, machine_type), designer:users(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductionOrders(data || []);
    } catch (error) {
      console.error('Error fetching production orders:', error);
    }
  };

  // Designer report menu items
  const designerReportMenuItems = [
    {
      name: 'Design',
      submenu: [
        { name: 'My Tasks', icon: 'fa-list-check' },
        { name: 'New Design Requests', icon: 'fa-plus-circle' },
        { name: 'Active Design Status', icon: 'fa-spinner' },
        { name: 'Customer Approval', icon: 'fa-user-check' },
        { name: 'Production Files', icon: 'fa-folder-open' },
        { name: 'Design Library', icon: 'fa-book' },
      ]
    },
    {
      name: 'Production',
      submenu: [
        { name: 'Send to Production', icon: 'fa-print' },
      ]
    },
  ];

  const getReportData = (module) => {
    switch (module) {
      case 'My Tasks':
        return myTasks.map(item => ({ ...item, _source: 'My Tasks' }));
      case 'New Design Requests':
        return designs.filter(d => d.status === 'New' || d.status === 'Pending').map(item => ({ ...item, _source: 'New Design Requests' }));
      case 'Active Design Status':
        return designs.filter(d => d.status === 'In Progress').map(item => ({ ...item, _source: 'Active Design Status' }));
      case 'Customer Approval':
        return customerApprovalVersions.map(item => ({ ...item, _source: 'Customer Approval' }));
      case 'Production Files':
        return designs.filter(d => d.status === 'Completed').map(item => ({ ...item, _source: 'Production Files' }));
      case 'Send to Production':
        return productionOrders.map(item => ({ ...item, _source: 'Send to Production' }));
      case 'Design Library':
        return designs.map(item => ({ ...item, _source: 'Design Library' }));
      default:
        return [];
    }
  };

  const getReportColumns = (module) => {
    const columnMap = {
      'My Tasks': [
        { key: 'design_type', label: 'Design Type' },
        { key: 'orders.order_no', label: 'Order No' },
        { key: 'orders.clients.name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'New Design Requests': [
        { key: 'design_type', label: 'Design Type' },
        { key: 'orders.order_no', label: 'Order No' },
        { key: 'orders.clients.name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Active Design Status': [
        { key: 'design_type', label: 'Design Type' },
        { key: 'orders.order_no', label: 'Order No' },
        { key: 'orders.clients.name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Customer Approval': [
        { key: 'designs.design_type', label: 'Design Type' },
        { key: 'designs.orders.order_no', label: 'Order No' },
        { key: 'designs.orders.clients.name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Production Files': [
        { key: 'design_type', label: 'Design Type' },
        { key: 'orders.order_no', label: 'Order No' },
        { key: 'orders.clients.name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Send to Production': [
        { key: 'orders.order_no', label: 'Order No' },
        { key: 'orders.clients.name', label: 'Client' },
        { key: 'material', label: 'Material' },
        { key: 'machines.name', label: 'Machine' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Design Library': [
        { key: 'design_type', label: 'Design Type' },
        { key: 'orders.order_no', label: 'Order No' },
        { key: 'orders.clients.name', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'created_at', label: 'Created Date' },
      ],
    };
    return columnMap[module] || [];
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const toggleReportSubmenu = (submenu) => {
    setReportSelectedModules(prev =>
      prev.includes(submenu)
        ? prev.filter(s => s !== submenu)
        : [...prev, submenu]
    );
  };

  const toggleReportTableColumn = (module, columnKey) => {
    setReportTableColumnVisibility(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [columnKey]: !prev[module]?.[columnKey]
      }
    }));
  };

  const setReportCurrentPage = (module, page) => {
    setReportTableCurrentPages(prev => ({
      ...prev,
      [module]: page
    }));
  };

  const getReportTotalPages = (dataLength) => {
    return Math.ceil(dataLength / reportItemsPerPage);
  };

  const getReportPaginatedData = (data, currentPage) => {
    const startIndex = (currentPage - 1) * reportItemsPerPage;
    const endIndex = startIndex + reportItemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const renderReportCellValue = (row, key) => {
    const value = key.split('.').reduce((acc, part) => acc && acc[part], row);
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      return value.name || value.order_no || value.invoice_no || JSON.stringify(value);
    }
    if (key.includes('date') && value) {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 15;
      const rightMargin = pageWidth / 2 + 10;
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Design Report', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`From: ${reportDateFrom}  To: ${reportDateTo}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Process each selected module
      reportSelectedModules.forEach((module) => {
        const moduleData = getReportData(module);
        const columns = getReportColumns(module);

        if (moduleData.length === 0) return;

        // Add section header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${module} (${moduleData.length})`, leftMargin, y);
        y += 8;

        // Split data into left and right sections
        const midPoint = Math.ceil(moduleData.length / 2);
        const leftData = moduleData.slice(0, midPoint);
        const rightData = moduleData.slice(midPoint);

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

        // Right section
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

        // Add page break between modules
        doc.addPage();
        y = 20;
      });

      doc.save(`Design_Report_${reportSelectedModules.join('_').replace(/\s+/g, '_')}_${reportDateFrom}_to_${reportDateTo}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF: ' + error.message);
    }
  };

  async function getFileUrl(filePath) {
    try {
      console.log('Attempting to get signed URL for:', filePath);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      if (error) {
        console.error('Supabase signed URL error:', error);
        // Try public URL as fallback
        const { data: publicData, error: publicError } = await supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        if (publicError) {
          console.error('Public URL error:', publicError);
          return null;
        }
        console.log('Using public URL:', publicData.publicUrl);
        return publicData.publicUrl;
      }
      console.log('Signed URL generated:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  async function updateDesignStatus(id, status) {
    await supabase.from('designs').update({ status }).eq('id', id);
    fetchDesigns();
  }

  function handleSectionChange(section) {
    setActiveSection(section);
  }

  // Designer-specific menu items for the TopHeader search
  const designerMenuItems = [
    { name: 'Dashboard', icon: 'fa-gauge', path: 'dashboard' },
    { name: 'My Tasks', icon: 'fa-list-check', path: 'my-tasks' },
    { name: 'New Design Requests', icon: 'fa-file-circle-plus', path: 'new-requests' },
    { name: 'Active Design Status', icon: 'fa-file-pen', path: 'active-status' },
    { name: 'Customer Approval', icon: 'fa-user-check', path: 'customer-approval' },
    { name: 'Production Files', icon: 'fa-folder-open', path: 'production-files' },
    { name: 'Send to Production', icon: 'fa-print', path: 'send-production' },
    { name: 'Design Library', icon: 'fa-book-open', path: 'design-library' },
    { name: 'Reports', icon: 'fa-chart-simple', path: 'reports' },
    { name: 'Messages', icon: 'fa-envelope', path: 'messages' },
    { name: 'Notifications', icon: 'fa-bell', path: 'notifications' },
    { name: 'Notes', icon: 'fa-sticky-note', path: 'notes' },
    { name: 'Settings', icon: 'fa-gear', path: 'settings' },
  ];

  // Map TopHeader navigation paths to DesignerPage section IDs
  const topHeaderNavigate = (path) => {
    const pathMap = {
      'dashboard': 'overview-section',
      'my-tasks': 'my-tasks-section',
      'new-requests': 'new-requests-section',
      'active-status': 'active-status-section',
      'customer-approval': 'customer-approval-section',
      'production-files': 'production-files-section',
      'send-production': 'send-production-section',
      'design-library': 'design-library-section',
      'reports': 'reports-section',
      'messages': 'private-messages-section',
      'notifications': 'notifications-section',
      'notes': 'notes-section',
      'settings': 'profile-settings-section',
    };
    const section = pathMap[path];
    if (section) {
      handleSectionChange(section);
    }
  };

  function toggleClock() {
    setClockedIn(!clockedIn);
    if (clockedIn) {
      const now = new Date();
      setClockOutTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } else {
      setClockOutTime('--:-- --');
    }
  }

  function getInitials(name) {
    if (!name) return 'DA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  const displayName = profile?.username || 'Designer';
  const initials = getInitials(displayName);

  // Dashboard computed metrics from real data
  const activeProjects = designs.filter(d => d.status === 'In Progress').length;
  const pendingApprovals = customerApprovalVersions.length;
  const completedDesigns = designs.filter(d => d.status === 'Completed').length;
  const myTaskCount = myTasks.length;
  const newRequests = designs.filter(d => d.status === 'Pending').length;
  const productionCount = productionOrders.length;
  const totalDesigns = designs.length;
  const efficiencyRate = totalDesigns > 0 ? ((completedDesigns / totalDesigns) * 100).toFixed(1) : '0.0';
  const highPriorityCount = designs.filter(d => d.priority === 'High').length;
  const mediumPriorityCount = designs.filter(d => d.priority === 'Medium').length;
  const lowPriorityCount = designs.filter(d => d.priority === 'Low').length;

  return (
    <div className="flex h-screen overflow-hidden text-slate-700 select-none">
      {/* SIDEBAR */}
      <div className="designer-sidebar w-64 bg-[#00ced1] text-white flex flex-col h-full justify-between text-xs shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
            <div className="text-xl font-black tracking-wider text-white flex items-center gap-1">
              <span className="text-red-500"><i className="fa-solid fa-vector-square"></i></span> VECTOR
            </div>
            <div className="text-[8px] text-slate-400 font-bold block uppercase leading-3">Advert &<br/>Manufacturing</div>
          </div>
          
          {/* Department Label */}
          <div className="p-4 text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <i className="fa-solid fa-grip"></i> Design Department
          </div>

          {/* Navigation Links */}
          <nav className="px-2 space-y-1">
            <button 
              onClick={() => handleSectionChange('overview-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded font-medium w-full ${activeSection === 'overview-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-gauge w-4"></i> Dashboard</div>
            </button>
            <button 
              onClick={() => handleSectionChange('my-tasks-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'my-tasks-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-list-check w-4"></i> My Tasks</div>
              {myTasks.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{myTasks.length}</span>
              )}
            </button>
            <button 
              onClick={() => handleSectionChange('new-requests-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'new-requests-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-file-circle-plus w-4"></i> New Design Requests</div>
              {designs.filter(d => d.status === 'Pending' || d.status === 'In Progress').length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{designs.filter(d => d.status === 'Pending' || d.status === 'In Progress').length}</span>
              )}
            </button>
            <button 
              onClick={() => handleSectionChange('active-status-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'active-status-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-file-pen w-4"></i> Active Design Status</div>
              {designs.filter(d => d.status === 'In Progress' && d.assigned_designer_id === user?.id).length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{designs.filter(d => d.status === 'In Progress' && d.assigned_designer_id === user?.id).length}</span>
              )}
            </button>
            <button 
              onClick={() => handleSectionChange('customer-approval-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'customer-approval-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-user-check w-4"></i> Customer Approval</div>
              {customerApprovalVersions.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{customerApprovalVersions.length}</span>
              )}
            </button>
            <button 
              onClick={() => handleSectionChange('production-files-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'production-files-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-folder-open w-4"></i> Production Files</div>
              {designs.filter(d => d.status === 'Completed').length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{designs.filter(d => d.status === 'Completed').length}</span>
              )}
            </button>
            <button
              onClick={() => handleSectionChange('send-production-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'send-production-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-print w-4"></i> Send to Production</div>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {productionOrders.length}
              </span>
            </button>
            <button
              onClick={() => handleSectionChange('design-library-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'design-library-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-book-open w-4"></i> Design Library</div>
              {designs.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{designs.length}</span>
              )}
            </button>
            <button
              onClick={() => handleSectionChange('reports-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'reports-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-chart-simple w-4"></i> Reports</div>
            </button>

            <div className="pt-4 pb-1 border-t border-slate-700/40 my-2"></div>
            <button 
              onClick={() => handleSectionChange('private-messages-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'private-messages-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-envelope w-4"></i> Messages</div>
              <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold hidden">0</span>
            </button>
            <button 
              onClick={() => handleSectionChange('notifications-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'notifications-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-bell w-4"></i> Notifications</div>
              {unreadNotificationCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadNotificationCount}</span>
              )}
            </button>
            <button 
              onClick={() => handleSectionChange('notes-section')}
              className={`flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'notes-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-sticky-note w-4"></i> Notes</div>
            </button>
            <button 
            //   onClick={() => handleSectionChange('hr-requests-section')}
              onClick={() => { window.location = 'https://vectoradvert.com/erp/hr' }}
              className={`flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'hr-requests-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-users w-4"></i> HR Requests</div>
            </button>
            <button 
              onClick={() => handleSectionChange('profile-settings-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'profile-settings-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-gear w-4"></i> Settings</div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="p-3 bg-[#00b8bb] border-t border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{initials}</div>
            <div>
              <h4 className="font-semibold text-slate-200">{displayName}</h4>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span> Online
              </p>
            </div>
          </div>
          
          {/* <div className="bg-slate-800/60 p-2.5 rounded mb-2 space-y-2 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clock In / Out</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Clock In Time <b className="block text-white text-xs">{clockInTime}</b></span>
              <span className="bg-green-600/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold">In</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Clock Out Time <b className="block text-white text-xs">{clockOutTime}</b></span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${clockedIn ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>{clockedIn ? 'Out' : 'In'}</span>
            </div>
          </div>
          <button onClick={toggleClock} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-1.5 text-center text-white font-medium rounded transition">Toggle Attendance</button> */}
          <button onClick={signOut} className="w-full mt-2 bg-[#0a1931] hover:bg-red-700 active:scale-[0.98] py-1.5 text-center text-white font-medium rounded transition flex items-center justify-center gap-2">
            <i className="fa-solid fa-right-from-bracket text-[11px]"></i> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER NAVBAR */}
        <TopHeader
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={topHeaderNavigate}
          menuItems={designerMenuItems}
        />

        {/* PAGE CONTENT - Will be populated with sections */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeSection === 'overview-section' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Design Dashboard</h1>
                  <p className="text-xs text-slate-500">Welcome back, {displayName}! Here's a live summary of your design operations.</p>
                </div>
                <div className="date-badge text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm">
                  <i className="fa-regular fa-calendar-days text-blue-600 mr-1"></i> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* KPI Metric Cards - Real Data */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* My Tasks */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSectionChange('my-tasks-section')}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">My Tasks</span>
                    <span className="text-2xl font-bold text-slate-900 block">{myTaskCount}</span>
                    <span className="text-[10px] text-blue-500 font-semibold"><i className="fa-solid fa-list-check"></i> Assigned to you</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-list-check"></i></div>
                </div>

                {/* Active Projects */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSectionChange('active-status-section')}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Projects</span>
                    <span className="text-2xl font-bold text-slate-900 block">{activeProjects}</span>
                    <span className="text-[10px] text-amber-500 font-semibold"><i className="fa-solid fa-spinner"></i> In progress</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-diagram-project"></i></div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSectionChange('customer-approval-section')}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                    <span className="text-2xl font-bold text-slate-900 block">{pendingApprovals}</span>
                    <span className="text-[10px] text-orange-500 font-semibold"><i className="fa-regular fa-clock"></i> Awaiting client</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-user-clock"></i></div>
                </div>

                {/* Completed Designs */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSectionChange('production-files-section')}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Completed</span>
                    <span className="text-2xl font-bold text-slate-900 block">{completedDesigns}</span>
                    <span className="text-[10px] text-green-500 font-semibold"><i className="fa-solid fa-circle-check"></i> Ready for production</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-circle-check"></i></div>
                </div>
              </div>

              {/* Secondary Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm"><i className="fa-solid fa-file-circle-plus"></i></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">New Requests</span>
                    <span className="text-lg font-bold text-slate-900">{newRequests}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm"><i className="fa-solid fa-print"></i></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Production Orders</span>
                    <span className="text-lg font-bold text-slate-900">{productionCount}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm"><i className="fa-solid fa-book-open"></i></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Designs</span>
                    <span className="text-lg font-bold text-slate-900">{totalDesigns}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm"><i className="fa-solid fa-gauge-high"></i></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Completion Rate</span>
                    <span className="text-lg font-bold text-slate-900">{efficiencyRate}%</span>
                  </div>
                </div>
              </div>

              {/* Status Distribution & Priority Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <i className="fa-solid fa-chart-pie text-blue-600"></i> Design Status Distribution
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Pending', count: newRequests, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'In Progress', count: activeProjects, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Completed', count: completedDesigns, color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
                    ].map((item) => {
                      const pct = totalDesigns > 0 ? ((item.count / totalDesigns) * 100).toFixed(0) : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-600 w-24">{item.label}</span>
                          <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                            <div className={`h-full ${item.color} rounded-lg transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-700">{item.count} ({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <i className="fa-solid fa-flag text-red-500"></i> Priority Breakdown
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2"><i className="fa-solid fa-fire"></i></div>
                      <span className="text-2xl font-bold text-red-700 block">{highPriorityCount}</span>
                      <span className="text-[10px] text-red-500 font-semibold uppercase">High</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2"><i className="fa-solid fa-bolt"></i></div>
                      <span className="text-2xl font-bold text-blue-700 block">{mediumPriorityCount}</span>
                      <span className="text-[10px] text-blue-500 font-semibold uppercase">Medium</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-2"><i className="fa-solid fa-leaf"></i></div>
                      <span className="text-2xl font-bold text-slate-700 block">{lowPriorityCount}</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Low</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-bolt text-amber-500"></i> Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => handleSectionChange('my-tasks-section')} className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                    <i className="fa-solid fa-list-check text-blue-600"></i>
                    <span className="text-xs font-semibold text-slate-700">View My Tasks</span>
                  </button>
                  <button onClick={() => handleSectionChange('new-requests-section')} className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                    <i className="fa-solid fa-file-circle-plus text-purple-600"></i>
                    <span className="text-xs font-semibold text-slate-700">New Requests</span>
                  </button>
                  <button onClick={() => handleSectionChange('customer-approval-section')} className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                    <i className="fa-solid fa-user-check text-orange-600"></i>
                    <span className="text-xs font-semibold text-slate-700">Approvals</span>
                  </button>
                  <button onClick={() => handleSectionChange('send-production-section')} className="flex items-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-left">
                    <i className="fa-solid fa-print text-indigo-600"></i>
                    <span className="text-xs font-semibold text-slate-700">Production</span>
                  </button>
                </div>
              </div>

              {/* Recent Design Activity Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-list text-slate-500"></i> Recent Design Activity</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Live Feed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Order No</th><th className="p-3">Client</th><th className="p-3">Design Type</th><th className="p-3">Designer</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 divide-y divide-slate-100">
                      {designs.slice(0, 8).map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => { setSelectedDesign(d); setShowDesignDetailModal(true); }}>
                          <td className="p-3 font-semibold text-blue-600">{d.orders?.order_no || '-'}</td>
                          <td className="p-3 font-bold text-slate-800">{d.orders?.clients?.name || '-'}</td>
                          <td className="p-3">{d.design_type || '-'}</td>
                          <td className="p-3">{d.assigned_designer?.username || profile?.username || '-'}</td>
                          <td className="p-3"><span className={`priority-badge ${d.priority === 'High' ? 'priority-high' : d.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>{d.priority || '-'}</span></td>
                          <td className="p-3"><span className={`status-badge ${d.status === 'Pending' ? 'status-pending' : d.status === 'In Progress' ? 'status-progress' : d.status === 'Completed' ? 'status-completed' : 'status-cancelled'}`}>{d.status}</span></td>
                          <td className="p-3 text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                      {designs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            <i className="fa-solid fa-inbox text-3xl block mb-2"></i>
                            No recent design activity
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'new-requests-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">New Design Requests</h1>
                  <p className="text-xs text-slate-500">Manage incoming design requests from clients</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by design type, client, or order..."
                      value={newRequestsSearch}
                      onChange={(e) => setNewRequestsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={newRequestsFilter}
                  onChange={(e) => setNewRequestsFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">Design Type</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Order</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Client</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Priority</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {designs
                        .filter(d => (d.status === 'Pending' || d.status === 'In Progress') && 
                          (newRequestsFilter === 'all' || d.status === newRequestsFilter))
                        .filter(d => {
                          const matchesSearch = 
                            (d.design_type?.toLowerCase() || '').includes(newRequestsSearch.toLowerCase()) ||
                            (d.orders?.clients?.name?.toLowerCase() || '').includes(newRequestsSearch.toLowerCase()) ||
                            (d.orders?.order_no?.toLowerCase() || '').includes(newRequestsSearch.toLowerCase());
                          return matchesSearch;
                        })
                        .map((d) => (
                        <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {d.design_type || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d.orders?.order_no || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d.orders?.clients?.name || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                d.priority === 'High'
                                  ? 'bg-red-50 text-red-700'
                                  : d.priority === 'Medium'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {d.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                // Fetch additional details for the selected design
                                const fetchDesignDetails = async () => {
                                  const { data: designers } = await supabase
                                    .from('users')
                                    .select('id, username')
                                    .eq('id', d.assigned_designer_id)
                                    .single();
                                  
                                  const allFileIds = d.attached_file_ids || [];
                                  const { data: files } = await supabase
                                    .from('files')
                                    .select('id, name, path')
                                    .in('id', allFileIds);

                                  const { data: designVersions } = await supabase
                                    .from('design_versions')
                                    .select('*, files(id, name, path)')
                                    .eq('design_id', d.id);

                                  const { data: communications } = await supabase
                                    .from('design_communications')
                                    .select('*, sender:sender_id(id, username), receiver:receiver_id(id, username)')
                                    .eq('design_id', d.id)
                                    .order('created_at', { ascending: false });

                                  // Generate signed URLs
                                  const urls = {};
                                  if (files) {
                                    for (const file of files) {
                                      if (file.path) {
                                        const url = await getFileUrl(file.path);
                                        if (url) urls[file.id] = url;
                                      }
                                    }
                                  }
                                  if (designVersions) {
                                    for (const version of designVersions) {
                                      if (version.files?.path) {
                                        const url = await getFileUrl(version.files.path);
                                        if (url) urls[version.files.id] = url;
                                      }
                                    }
                                  }
                                  setFileUrls(urls);

                                  setSelectedTask({
                                    ...d,
                                    assigned_designer: designers,
                                    attached_files: files || [],
                                    design_versions: designVersions || [],
                                    communications: communications || []
                                  });
                                  setShowTaskModal(true);
                                };
                                fetchDesignDetails();
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {designs
                        .filter(d => (d.status === 'Pending' || d.status === 'In Progress') && 
                          (newRequestsFilter === 'all' || d.status === newRequestsFilter))
                        .filter(d => {
                          const matchesSearch = 
                            (d.design_type?.toLowerCase() || '').includes(newRequestsSearch.toLowerCase()) ||
                            (d.orders?.clients?.name?.toLowerCase() || '').includes(newRequestsSearch.toLowerCase()) ||
                            (d.orders?.order_no?.toLowerCase() || '').includes(newRequestsSearch.toLowerCase());
                          return matchesSearch;
                        }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            No design requests found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'active-status-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Active Design Status</h1>
                  <p className="text-xs text-slate-500">Track design progress, versions and communication</p>
                </div>
                <div className="flex gap-2 text-xs font-medium">
                  <button className="bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm text-slate-700 flex items-center gap-1.5 hover:bg-slate-50">
                    <i className="fa-regular fa-calendar text-blue-500"></i> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </button>
                  <button className="bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm text-slate-700 flex items-center gap-1.5 hover:bg-slate-50">
                    <i className="fa-solid fa-print"></i> Print / Export
                  </button>
                </div>
              </div>

              {true ? (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-comments text-blue-600"></i> Registered Projects — Chat Selection
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-1">Click any registered data row to open its design status & chat interface.</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                      <i className="fa-solid fa-database text-blue-500"></i>
                      <span>{designs.filter(d => d.status === 'In Progress' && d.assigned_designer_id === user?.id).length}</span> registered
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-3 bg-slate-50/50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-list text-slate-500"></i> All Registered Design Projects
                      </h3>
                      <div className="flex gap-2">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search by order, client, project..." 
                            value={adsSearchQuery}
                            onChange={(e) => setAdsSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 w-64"
                          />
                          <i className="fa-solid fa-magnifying-glass absolute left-2.5 text-slate-400 text-xs" style={{top: '50%', transform: 'translateY(-50%)'}}></i>
                        </div>
                        <select
                          value={activeDesignFilter}
                          onChange={(e) => setActiveDesignFilter(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="all">All Priority</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="p-3 w-10">#</th>
                            <th className="p-3">Order No.</th>
                            <th className="p-3">Client</th>
                            <th className="p-3">Lead / Project</th>
                            <th className="p-3">Designer</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3 text-center w-32">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 divide-y divide-slate-100">
                          {designs
                            .filter(d => 
                              d.status === 'In Progress' && 
                              d.assigned_designer_id === user?.id &&
                              (activeDesignFilter === 'all' || d.priority === activeDesignFilter) &&
                              (!adsSearchQuery || 
                              d.orders?.order_no?.toLowerCase().includes(adsSearchQuery.toLowerCase()) ||
                              d.orders?.clients?.name?.toLowerCase().includes(adsSearchQuery.toLowerCase()) ||
                              d.design_type?.toLowerCase().includes(adsSearchQuery.toLowerCase()))
                            )
                            .map((d, index) => (
                            <tr key={d.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => { setSelectedDesign(d); setShowDesignDetailModal(true); }}>
                              <td className="p-3">{index + 1}</td>
                              <td className="p-3 font-semibold text-blue-600">{d.orders?.order_no || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">{d.orders?.clients?.name || '-'}</td>
                              <td className="p-3">{d.design_type || '-'}</td>
                              <td className="p-3">{profile?.username || 'Designer'}</td>
                              <td className="p-3">
                                <span className={`status-badge ${d.status === 'Pending' ? 'status-pending' : d.status === 'In Progress' ? 'status-progress' : d.status === 'Completed' ? 'status-completed' : 'status-cancelled'}`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`priority-badge ${d.priority === 'High' ? 'priority-high' : d.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                                  {d.priority}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                          {designs
                            .filter(d => 
                              d.status === 'In Progress' && 
                              d.assigned_designer_id === user?.id &&
                              (activeDesignFilter === 'all' || d.priority === activeDesignFilter) &&
                              (!adsSearchQuery || 
                              d.orders?.order_no?.toLowerCase().includes(adsSearchQuery.toLowerCase()) ||
                              d.orders?.clients?.name?.toLowerCase().includes(adsSearchQuery.toLowerCase()) ||
                              d.design_type?.toLowerCase().includes(adsSearchQuery.toLowerCase()))
                            ).length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                No active design requests found matching your criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <button onClick={() => setSelectedDesign(null)} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 shadow-sm">
                      <i className="fa-solid fa-arrow-left"></i> Back to Registered Projects
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info text-blue-500"></i> Viewing project details & chat interface
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-4 gap-6 text-xs shadow-sm">
                    <div className="flex gap-3">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit text-lg"><i className="fa-solid fa-box"></i></div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Order No.</span>
                          <span className="font-bold text-slate-900">{selectedDesign.orders?.order_no || '-'}</span>
                          <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[9px] ml-1.5">Active</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Client / Project</span>
                          <span className="font-semibold text-slate-800">{selectedDesign.orders?.clients?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Requested By (Front Desk)</span>
                          <span className="text-slate-700">Front Desk</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 pl-4 border-l border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Design Type</span>
                        <span className="font-semibold text-slate-800">{selectedDesign.design_type || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Purpose</span>
                        <span className="text-slate-700">{selectedDesign.purpose || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Priority</span>
                        <span className={`priority-badge ${selectedDesign.priority === 'High' ? 'priority-high' : selectedDesign.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                          {selectedDesign.priority}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 pl-4 border-l border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Status</span>
                        <span className={`status-badge ${selectedDesign.status === 'Pending' ? 'status-pending' : selectedDesign.status === 'In Progress' ? 'status-progress' : selectedDesign.status === 'Completed' ? 'status-completed' : 'status-cancelled'}`}>
                          {selectedDesign.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Requested Date</span>
                        <span className="text-slate-700">{selectedDesign.requested_date ? new Date(selectedDesign.requested_date).toLocaleDateString() : '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Required Date</span>
                        <span className="text-slate-700">{selectedDesign.required_date ? new Date(selectedDesign.required_date).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2 pl-4 border-l border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Assigned Designer</span>
                        <span className="font-semibold text-slate-800">{profile?.username || 'Designer'}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {selectedDesign.status === 'Pending' && (
                          <button onClick={() => { updateDesignStatus(selectedDesign.id, 'In Progress'); setSelectedDesign({...selectedDesign, status: 'In Progress'}); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                            Start
                          </button>
                        )}
                        {selectedDesign.status === 'In Progress' && (
                          <button onClick={() => { updateDesignStatus(selectedDesign.id, 'Completed'); setSelectedDesign({...selectedDesign, status: 'Completed'}); }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Specifications & Brief</h3>
                    <p className="text-sm text-slate-600">{selectedDesign.specifications || selectedDesign.brief_dimensions || 'No specifications provided.'}</p>
                    {selectedDesign.special_instructions && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Special Instructions</span>
                        <p className="text-sm text-amber-900 mt-1">{selectedDesign.special_instructions}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Communication & Chat</h3>
                    <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-400 text-sm">
                      <i className="fa-regular fa-comments text-2xl mb-2"></i>
                      <p>Chat interface will be implemented here</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'my-tasks-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">My Tasks</h1>
                  <p className="text-xs text-slate-500">Your assigned design tasks and deadlines</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by design type, client, or order..."
                      value={myTasksSearch}
                      onChange={(e) => setMyTasksSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={myTasksFilter}
                  onChange={(e) => setMyTasksFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Design Type</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Order</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Client</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Priority</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Due Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTasks
                      .filter(d => {
                        const matchesSearch = 
                          (d.design_type?.toLowerCase() || '').includes(myTasksSearch.toLowerCase()) ||
                          (d.orders?.clients?.name?.toLowerCase() || '').includes(myTasksSearch.toLowerCase()) ||
                          (d.orders?.order_no?.toLowerCase() || '').includes(myTasksSearch.toLowerCase());
                        const matchesFilter = myTasksFilter === 'all' || d.status === myTasksFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((d) => (
                      <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {d.design_type || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.orders?.order_no || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.orders?.clients?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              d.priority === 'High'
                                ? 'bg-red-50 text-red-700'
                                : d.priority === 'Medium'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {d.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.required_date ? new Date(d.required_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => { setSelectedTask(d); setShowTaskModal(true); }}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myTasks.filter(d => {
                      const matchesSearch = 
                        (d.design_type?.toLowerCase() || '').includes(myTasksSearch.toLowerCase()) ||
                        (d.orders?.clients?.name?.toLowerCase() || '').includes(myTasksSearch.toLowerCase()) ||
                        (d.orders?.order_no?.toLowerCase() || '').includes(myTasksSearch.toLowerCase());
                      const matchesFilter = myTasksFilter === 'all' || d.status === myTasksFilter;
                      return matchesSearch && matchesFilter;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No tasks found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'customer-approval-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Customer Approval</h1>
                  <p className="text-xs text-slate-500">Design versions awaiting customer approval</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                  <i className="fa-solid fa-database text-blue-500"></i>
                  <span>{customerApprovalVersions.length}</span> versions
                </span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by order, client, or design type..."
                      value={customerApprovalSearch}
                      onChange={(e) => setCustomerApprovalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50/50 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-list text-slate-500"></i> Design Versions Awaiting Approval
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Order No.</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Design Type</th>
                        <th className="p-3">Version</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Sent On</th>
                        <th className="p-3">Sent By</th>
                        <th className="p-3 text-center w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 divide-y divide-slate-100">
                      {customerApprovalVersions
                        .filter(version => {
                          const matchesSearch = 
                            (version.designs?.orders?.order_no?.toLowerCase() || '').includes(customerApprovalSearch.toLowerCase()) ||
                            (version.designs?.orders?.clients?.name?.toLowerCase() || '').includes(customerApprovalSearch.toLowerCase()) ||
                            (version.designs?.design_type?.toLowerCase() || '').includes(customerApprovalSearch.toLowerCase());
                          return matchesSearch;
                        })
                        .length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No design versions found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        customerApprovalVersions
                          .filter(version => {
                            const matchesSearch = 
                              (version.designs?.orders?.order_no?.toLowerCase() || '').includes(customerApprovalSearch.toLowerCase()) ||
                              (version.designs?.orders?.clients?.name?.toLowerCase() || '').includes(customerApprovalSearch.toLowerCase()) ||
                              (version.designs?.design_type?.toLowerCase() || '').includes(customerApprovalSearch.toLowerCase());
                            return matchesSearch;
                          })
                          .map((version, index) => (
                          <tr key={version.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3 font-semibold text-blue-600">{version.designs?.orders?.order_no || '-'}</td>
                            <td className="p-3 font-bold text-slate-800">{version.designs?.orders?.clients?.name || '-'}</td>
                            <td className="p-3">{version.designs?.design_type || '-'}</td>
                            <td className="p-3">Version {version.version_number}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                version.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                version.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                version.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {version.status}
                              </span>
                            </td>
                            <td className="p-3">{version.sent_on ? new Date(version.sent_on).toLocaleDateString() : '-'}</td>
                            <td className="p-3">{version.sent_by || '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => { setSelectedDesign(version.designs); setSelectedVersion(version); setShowDesignDetailModal(true); }}
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'profile-settings-section' && (
            <SettingsPage />
          )}

          {activeSection === 'notifications-section' && (
            <NotificationsPage />
          )}

          {activeSection === 'private-messages-section' && (
            <MessagesPage />
          )}

          {activeSection === 'production-files-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Production Files</h1>
                  <p className="text-xs text-slate-500">Completed designs ready for production</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                  <i className="fa-solid fa-database text-blue-500"></i>
                  <span>{designs.filter(d => d.status === 'Completed').length}</span> completed
                </span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by order, client, or design type..."
                      value={productionFilesSearch}
                      onChange={(e) => setProductionFilesSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50/50 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-list text-slate-500"></i> Completed Designs
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Order No.</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Design Type</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Assigned Designer</th>
                        <th className="p-3">Completed Date</th>
                        <th className="p-3 text-center w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 divide-y divide-slate-100">
                      {designs
                        .filter(d => d.status === 'Completed')
                        .filter(d => {
                          const matchesSearch = 
                            (d.orders?.order_no?.toLowerCase() || '').includes(productionFilesSearch.toLowerCase()) ||
                            (d.orders?.clients?.name?.toLowerCase() || '').includes(productionFilesSearch.toLowerCase()) ||
                            (d.design_type?.toLowerCase() || '').includes(productionFilesSearch.toLowerCase());
                          return matchesSearch;
                        })
                        .length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No completed designs found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        designs
                          .filter(d => d.status === 'Completed')
                          .filter(d => {
                            const matchesSearch = 
                              (d.orders?.order_no?.toLowerCase() || '').includes(productionFilesSearch.toLowerCase()) ||
                              (d.orders?.clients?.name?.toLowerCase() || '').includes(productionFilesSearch.toLowerCase()) ||
                              (d.design_type?.toLowerCase() || '').includes(productionFilesSearch.toLowerCase());
                            return matchesSearch;
                          })
                          .map((d, index) => (
                          <tr key={d.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3 font-semibold text-blue-600">{d.orders?.order_no || '-'}</td>
                            <td className="p-3 font-bold text-slate-800">{d.orders?.clients?.name || '-'}</td>
                            <td className="p-3">{d.design_type || '-'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                d.priority === 'High' ? 'bg-red-100 text-red-700' :
                                d.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {d.priority}
                              </span>
                            </td>
                            <td className="p-3">{d.assigned_designer?.username || '-'}</td>
                            <td className="p-3">{d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => { setSelectedTask(d); setShowTaskModal(true); }}
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'send-production-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Send to Production</h1>
                  <p className="text-xs text-slate-500">Queue designs for production</p>
                </div>
                <button
                  onClick={() => setShowProductionOrderModal(true)}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  New Production Order
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : productionOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                  <i className="fa-solid fa-print text-4xl mb-4"></i>
                  <p className="text-sm">No production orders yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">Task Name</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Order</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Material</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Machine</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Designer</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Priority</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Job Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionOrders.map((order) => (
                        <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {order.material || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {order.orders?.order_no || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {order.material} / {order.thickness} / {order.color}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {order.machines?.name || '-'} ({order.machines?.machine_type || '-'})
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {order.designer?.username || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                order.priority === 'High'
                                  ? 'bg-rose-100 text-rose-700'
                                  : order.priority === 'Medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                order.status === 'New'
                                  ? 'bg-blue-100 text-blue-700'
                                  : order.status === 'In Progress'
                                  ? 'bg-amber-100 text-amber-700'
                                  : order.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                order.job_type === 'received'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {order.job_type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'reports-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Reports</h1>
                  <p className="text-xs text-slate-500">Generate comprehensive reports with search, filtering, date range selection, and PDF export.</p>
                </div>
                <button onClick={handleExportPDF} className="px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-file-pdf"></i> Export PDF
                </button>
              </div>

              {/* Date Range Filter */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex gap-4 items-center flex-wrap">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={reportDateFrom}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={reportDateTo}
                      onChange={(e) => setReportDateTo(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Items Per Page</label>
                    <select
                      value={reportItemsPerPage}
                      onChange={(e) => {
                        setReportItemsPerPage(Number(e.target.value));
                        setReportTableCurrentPages({});
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
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Reports</label>
                <div className="relative">
                  <button
                    onClick={() => setShowReportDropdown(!showReportDropdown)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-left flex justify-between items-center"
                  >
                    <span>
                      {reportSelectedModules.length === 0
                        ? 'Select reports...'
                        : `${reportSelectedModules.length} report${reportSelectedModules.length > 1 ? 's' : ''} selected`}
                    </span>
                    <i className={`fa-solid fa-chevron-${showReportDropdown ? 'up' : 'down'}`}></i>
                  </button>

                  {showReportDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 max-h-96 overflow-y-auto">
                      <div className="space-y-4">
                        {designerReportMenuItems.map(menu => (
                          <div key={menu.name}>
                            <div className="text-sm font-semibold text-slate-800 mb-2">{menu.name}</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {menu.submenu.map(sub => (
                                <label key={sub.name} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={reportSelectedModules.includes(sub.name)}
                                    onChange={() => toggleReportSubmenu(sub.name)}
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
              {reportSelectedModules.map(module => {
                const moduleData = getReportData(module);
                const columns = getReportColumns(module);

                // Initialize column visibility for this module
                if (!reportTableColumnVisibility[module]) {
                  reportTableColumnVisibility[module] = {};
                  columns.forEach(col => {
                    reportTableColumnVisibility[module][col.key] = true;
                  });
                }

                const visibleColumnsForModule = columns.filter(col =>
                  reportTableColumnVisibility[module]?.[col.key] !== false
                );

                // Filter data based on table-specific search query
                const tableSearchQuery = reportTableSearchQueries[module] || '';
                const filteredModuleData = moduleData.filter(row => {
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
                const currentPage = reportTableCurrentPages[module] || 1;
                const totalPages = getReportTotalPages(filteredModuleData.length);
                const paginatedData = getReportPaginatedData(filteredModuleData, currentPage);

                return (
                  <div key={module} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">{module} ({filteredModuleData.length})</h3>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={`Search ${module}...`}
                            value={reportTableSearchQueries[module] || ''}
                            onChange={(e) => setReportTableSearchQueries(prev => ({
                              ...prev,
                              [module]: e.target.value
                            }))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {columns.map(col => (
                            <button
                              key={col.key}
                              onClick={() => toggleReportTableColumn(module, col.key)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                reportTableColumnVisibility[module]?.[col.key] !== false
                                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                                  : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <i className={`fa-solid ${reportTableColumnVisibility[module]?.[col.key] !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>
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
                          {visibleColumnsForModule.map(col => (
                            <th key={col.key} className="p-4 text-left text-xs font-semibold text-slate-600">{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumnsForModule.length + 1} className="p-8 text-center text-slate-400">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((row, index) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="p-4 text-center">{(currentPage - 1) * reportItemsPerPage + index + 1}</td>
                              {visibleColumnsForModule.map(col => (
                                <td key={col.key} className="p-4">
                                  {renderReportCellValue(row, col.key)}
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
                          Page {currentPage} of {totalPages} ({filteredModuleData.length} total)
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setReportCurrentPage(module, currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded border border-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                          >
                            Previous
                          </button>
                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setReportCurrentPage(module, page)}
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
                            onClick={() => setReportCurrentPage(module, currentPage + 1)}
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
            </div>
          )}

          {activeSection === 'design-library-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Design Library</h1>
                  <p className="text-xs text-slate-500">All designs across all statuses and users</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                  <i className="fa-solid fa-database text-blue-500"></i>
                  <span>{designs.length}</span> total designs
                </span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by design type, client, or order..."
                      value={designLibrarySearch}
                      onChange={(e) => setDesignLibrarySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={designLibraryFilter}
                  onChange={(e) => setDesignLibraryFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">Design Type</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Order</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Client</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Priority</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Assigned Designer</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {designs
                        .filter(d => designLibraryFilter === 'all' || d.status === designLibraryFilter)
                        .filter(d => {
                          const matchesSearch = 
                            (d.design_type?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase()) ||
                            (d.orders?.clients?.name?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase()) ||
                            (d.orders?.order_no?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase());
                          return matchesSearch;
                        })
                        .map((d) => (
                        <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {d.design_type || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d.orders?.order_no || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d.orders?.clients?.name || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                d.priority === 'High'
                                  ? 'bg-red-50 text-red-700'
                                  : d.priority === 'Medium'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {d.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d.assigned_designer?.username || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const fetchDesignDetails = async () => {
                                  const { data: designers } = await supabase
                                    .from('users')
                                    .select('id, username')
                                    .eq('id', d.assigned_designer_id)
                                    .single();
                                  
                                  const allFileIds = d.attached_file_ids || [];
                                  const { data: files } = await supabase
                                    .from('files')
                                    .select('id, name, path')
                                    .in('id', allFileIds);

                                  const { data: designVersions } = await supabase
                                    .from('design_versions')
                                    .select('*, files(id, name, path)')
                                    .eq('design_id', d.id);

                                  const { data: communications } = await supabase
                                    .from('design_communications')
                                    .select('*, sender:sender_id(id, username), receiver:receiver_id(id, username)')
                                    .eq('design_id', d.id)
                                    .order('created_at', { ascending: false });

                                  const urls = {};
                                  if (files) {
                                    for (const file of files) {
                                      if (file.path) {
                                        const url = await getFileUrl(file.path);
                                        if (url) urls[file.id] = url;
                                      }
                                    }
                                  }
                                  if (designVersions) {
                                    for (const version of designVersions) {
                                      if (version.files?.path) {
                                        const url = await getFileUrl(version.files.path);
                                        if (url) urls[version.files.id] = url;
                                      }
                                    }
                                  }
                                  setFileUrls(urls);

                                  setSelectedTask({
                                    ...d,
                                    assigned_designer: designers,
                                    attached_files: files || [],
                                    design_versions: designVersions || [],
                                    communications: communications || []
                                  });
                                  setShowTaskModal(true);
                                };
                                fetchDesignDetails();
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {designs
                        .filter(d => designLibraryFilter === 'all' || d.status === designLibraryFilter)
                        .filter(d => {
                          const matchesSearch = 
                            (d.design_type?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase()) ||
                            (d.orders?.clients?.name?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase()) ||
                            (d.orders?.order_no?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase());
                          return matchesSearch;
                        }).length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            No designs found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'notes-section' && (
            <NotesPage />
          )}

          {activeSection === 'hr-requests-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">HR Requests</h1>
                  <p className="text-xs text-slate-500">Submit and track HR requests</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-users text-4xl mb-4"></i>
                <p className="text-sm">HR requests coming soon</p>
              </div>
            </div>
          )}

          {activeSection !== 'overview-section' && activeSection !== 'new-requests-section' && activeSection !== 'active-status-section' && activeSection !== 'my-tasks-section' && activeSection !== 'customer-approval-section' && activeSection !== 'profile-settings-section' && activeSection !== 'notifications-section' && activeSection !== 'private-messages-section' && activeSection !== 'production-files-section' && activeSection !== 'send-production-section' && activeSection !== 'design-library-section' && activeSection !== 'reports-section' && activeSection !== 'notes-section' && activeSection !== 'hr-requests-section' && (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <i className="fa-solid fa-tools text-4xl mb-4"></i>
                <p className="text-sm">Section under construction</p>
              </div>
            </div>
          )}

          {/* Task Detail Modal */}
          {showTaskModal && selectedTask && (
            <div className="modal-overlay" style={{display: 'flex'}}>
              <div className="modal-content">
                <div className="close-modal-icon" onClick={() => setShowTaskModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Task Details</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Design Type</span>
                    <p className="font-semibold text-slate-900">{selectedTask.design_type || '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purpose</span>
                    <p className="text-slate-700">{selectedTask.purpose || '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Date</span>
                    <p className="text-slate-700">{selectedTask.requested_date ? new Date(selectedTask.requested_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Required Date</span>
                    <p className="text-slate-700">{selectedTask.required_date ? new Date(selectedTask.required_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                    <span className={`status-badge ${selectedTask.status === 'Pending' ? 'status-pending' : selectedTask.status === 'In Progress' ? 'status-progress' : selectedTask.status === 'Completed' ? 'status-completed' : 'status-cancelled'}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</span>
                    <span className={`priority-badge ${selectedTask.priority === 'High' ? 'priority-high' : selectedTask.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Designer</span>
                    <p className="text-slate-700">{selectedTask.assigned_designer?.username || '-'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Brief Dimensions</h3>
                  <p className="text-sm text-slate-600">{selectedTask.brief_dimensions || '-'}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Specifications</h3>
                  <p className="text-sm text-slate-600">{selectedTask.specifications || '-'}</p>
                </div>

                {selectedTask.special_instructions && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Special Instructions</h3>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-900">{selectedTask.special_instructions}</p>
                    </div>
                  </div>
                )}

                {selectedTask.internal_notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Internal Notes</h3>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600">{selectedTask.internal_notes}</p>
                    </div>
                  </div>
                )}

                {selectedTask.attached_files && selectedTask.attached_files.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Attached Files</h3>
                    <div className="space-y-2">
                      {selectedTask.attached_files.map((file) => {
                        const fileUrl = fileUrls[file.id];
                        return (
                          <div key={file.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                            <i className="fa-solid fa-paperclip text-blue-600"></i>
                            <span className="text-slate-600">{file.name}</span>
                            {fileUrl ? (
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-auto text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <i className="fa-solid fa-external-link-alt"></i> Open
                              </a>
                            ) : (
                              <span className="ml-auto text-slate-400 text-xs">No URL available</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedTask.design_versions && selectedTask.design_versions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Design Versions</h3>
                    <div className="space-y-3">
                      {selectedTask.design_versions.map((version) => (
                        <div key={version.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">Version {version.version_number}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                version.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                version.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                version.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {version.status}
                              </span>
                            </div>
                            {version.sent_on && (
                              <span className="text-xs text-slate-500">
                                {new Date(version.sent_on).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {version.description && (
                            <p className="text-sm text-slate-600 mb-2">{version.description}</p>
                          )}
                          {version.files && (
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-file text-slate-400"></i>
                              <span className="text-sm text-slate-600">{version.files.name}</span>
                              {fileUrls[version.files.id] && (
                                <a 
                                  href={fileUrls[version.files.id]} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-auto text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                >
                                  <i className="fa-solid fa-external-link-alt"></i> Open
                                </a>
                              )}
                            </div>
                          )}
                          {version.sent_by && (
                            <div className="text-xs text-slate-500 mt-2">
                              Sent by: {version.sent_by}
                            </div>
                          )}
                          {version.comment && (
                            <div className="mt-2 p-2 bg-white border border-slate-200 rounded text-xs text-slate-600">
                              <span className="font-semibold">Comment:</span> {version.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.communications && selectedTask.communications.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Communications</h3>
                    <div className="space-y-3">
                      {selectedTask.communications.map((comm) => (
                        <div key={comm.id} className={`p-4 rounded-lg border ${comm.is_read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{comm.sender?.username || 'Unknown'}</span>
                              {!comm.is_read && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">New</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(comm.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{comm.message}</p>
                          {comm.attached_file_ids && comm.attached_file_ids.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <i className="fa-solid fa-paperclip"></i>
                              <span>{comm.attached_file_ids.length} file(s) attached</span>
                            </div>
                          )}
                          {comm.receiver && (
                            <div className="text-xs text-slate-500 mt-2">
                              To: {comm.receiver.username}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  {selectedTask.assigned_designer_id === user?.id && selectedTask.status === 'Pending' && (
                    <button 
                      onClick={() => { updateDesignStatus(selectedTask.id, 'In Progress'); setSelectedTask({...selectedTask, status: 'In Progress'}); }}
                      className="btn-primary-custom"
                    >
                      <i className="fa-solid fa-play"></i> Start Task
                    </button>
                  )}
                  {selectedTask.assigned_designer_id === user?.id && selectedTask.status === 'In Progress' && (
                    <button 
                      onClick={() => { updateDesignStatus(selectedTask.id, 'Completed'); setSelectedTask({...selectedTask, status: 'Completed'}); }}
                      className="btn-primary-custom"
                    >
                      <i className="fa-solid fa-check"></i> Complete Task
                    </button>
                  )}
                  <button onClick={() => setShowTaskModal(false)} className="btn-secondary-custom">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Design Detail Modal */}
      {showDesignDetailModal && selectedDesign && (
        <DesignDetailModal
          design={selectedDesign}
          selectedVersion={selectedVersion}
          onClose={() => { setShowDesignDetailModal(false); setSelectedDesign(null); setSelectedVersion(null); }}
        />
      )}

      {/* Production Order Modal */}
      {showProductionOrderModal && (
        <ProductionOrderModal
          onClose={() => setShowProductionOrderModal(false)}
          onSuccess={() => {
            fetchProductionOrders();
            setShowProductionOrderModal(false);
          }}
        />
      )}
    </div>
  );
}