import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
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
  const [adsSearchQuery, setAdsSearchQuery] = useState('');
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCalDropdown, setShowCalDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [fileUrls, setFileUrls] = useState({});

  useEffect(() => {
    fetchDesigns();
    fetchMyTasks();
  }, []);

  async function fetchDesigns() {
    setLoading(true);
    const { data } = await supabase
      .from('designs')
      .select('*, orders(order_no, clients(name))')
      .order('created_at', { ascending: false });
    if (data) setDesigns(data);
    setLoading(false);
  }

  async function fetchMyTasks() {
    if (!user?.id) return;
    const { data } = await supabase
      .from('designs')
      .select('*, orders(order_no, clients(name))')
      .eq('assigned_designer_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      // Fetch assigned designer names
      const designerIds = [...new Set(data.map(d => d.assigned_designer_id).filter(Boolean))];
      const { data: designers } = await supabase
        .from('users')
        .select('id, username')
        .in('id', designerIds);
      
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
        assigned_designer: designers?.find(d => d.id === task.assigned_designer_id),
        attached_files: files?.filter(f => (task.attached_file_ids || []).includes(f.id)) || [],
        design_versions: designVersions?.filter(v => v.design_id === task.id) || []
      }));
      
      setMyTasks(tasksWithDetails);
    }
  }

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
  const sectionTitle = activeSection.replace('-section', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex h-screen overflow-hidden text-slate-700 select-none">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#0a1931] text-white flex flex-col h-full justify-between text-xs shrink-0">
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
              <div className="flex items-center gap-3"><i className="fa-solid fa-gauge w-4"></i> Overview</div>
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
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">18</span>
            </button>
            <button 
              onClick={() => handleSectionChange('customer-approval-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'customer-approval-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-user-check w-4"></i> Customer Approval</div>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">16</span>
            </button>
            <button 
              onClick={() => handleSectionChange('production-files-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'production-files-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-folder-open w-4"></i> Production Files</div>
            </button>
            <button 
              onClick={() => handleSectionChange('send-production-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'send-production-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-print w-4"></i> Send to Production</div>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">7</span>
            </button>
            <button 
              onClick={() => handleSectionChange('design-library-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'design-library-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-book-open w-4"></i> Design Library</div>
            </button>
            
            <div className="pt-4 pb-1 border-t border-slate-700/40 my-2"></div>

            <button 
              onClick={() => handleSectionChange('reports-section')}
              className={`flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'reports-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-chart-bar w-4"></i> Reports</div>
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
            <button 
              onClick={() => handleSectionChange('notes-section')}
              className={`flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'notes-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-sticky-note w-4"></i> Notes</div>
            </button>
            <button 
              onClick={() => handleSectionChange('hr-requests-section')}
              className={`flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'hr-requests-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-users w-4"></i> HR Requests</div>
            </button>
            <button 
              onClick={() => handleSectionChange('notifications-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'notifications-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-bell w-4"></i> Notifications</div>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">0</span>
            </button>
            <button 
              onClick={() => handleSectionChange('private-messages-section')}
              className={`nav-item flex items-center justify-between px-3 py-2.5 rounded w-full ${activeSection === 'private-messages-section' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3"><i className="fa-solid fa-envelope w-4"></i> Messages</div>
              <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold hidden">0</span>
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
        <div className="p-3 bg-slate-900/60 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{initials}</div>
            <div>
              <h4 className="font-semibold text-slate-200">{displayName}</h4>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span> Online
              </p>
            </div>
          </div>
          
          <div className="bg-slate-800/60 p-2.5 rounded mb-2 space-y-2 text-[11px]">
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
          <button onClick={toggleClock} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-1.5 text-center text-white font-medium rounded transition">Toggle Attendance</button>
          <button onClick={signOut} className="w-full mt-2 bg-slate-700 hover:bg-red-700 active:scale-[0.98] py-1.5 text-center text-white font-medium rounded transition flex items-center justify-center gap-2">
            <i className="fa-solid fa-right-from-bracket text-[11px]"></i> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER NAVBAR */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Dashboard</span> <i className="fa-solid fa-chevron-right text-[9px]"></i> 
            <span>{sectionTitle}</span>
          </div>
          {/* Search Bar */}
          <div className="relative w-80">
            <input type="text" placeholder="Search by order no., client, project, status..." className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 transition-all" />
            <i className="fa-solid fa-magnifying-glass absolute right-3 text-slate-400 text-xs" style={{top: '50%', transform: 'translateY(-50%)'}}></i>
          </div>
          {/* Action Icons & Profile */}
          <div className="flex items-center gap-4 text-slate-600">
            {/* Chat Icon */}
            <div className="relative">
              <div className="relative cursor-pointer hover:text-blue-600 transition" onClick={() => setShowChatDropdown(!showChatDropdown)}>
                <i className="fa-regular fa-comment-dots text-lg"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full hidden">0</span>
              </div>
              {showChatDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Messages</span>
                    <button onClick={() => { setShowChatDropdown(false); handleSectionChange('private-messages-section'); }} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Open inbox →</button>
                  </div>
                  <div className="p-4 text-center text-slate-400 text-xs">No new messages</div>
                </div>
              )}
            </div>

            {/* Bell Icon */}
            <div className="relative">
              <div className="relative cursor-pointer hover:text-blue-600 transition" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <i className="fa-regular fa-bell text-lg"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full">0</span>
              </div>
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">Mark all read</button>
                  </div>
                  <div className="p-4 text-center text-slate-400 text-xs">No new notifications</div>
                </div>
              )}
            </div>

            {/* Calendar Icon */}
            <div className="relative">
              <div className="cursor-pointer hover:text-blue-600 transition" onClick={() => setShowCalDropdown(!showCalDropdown)}>
                <i className="fa-regular fa-calendar-days text-lg"></i>
              </div>
              {showCalDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Calendar & Deadlines</span>
                    <button onClick={() => setShowCalDropdown(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                  </div>
                  <div className="p-4 text-center text-slate-400 text-xs">No upcoming deadlines</div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <div className="flex items-center gap-2 border-l pl-4 border-slate-200 cursor-pointer hover:bg-slate-50 rounded-lg transition py-1 pr-2" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                <div className="w-8 h-8 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">{initials}</div>
                <div className="text-left text-[11px]">
                  <p className="font-semibold text-slate-800 leading-3">{displayName}</p>
                  <span className="text-slate-400 text-[10px]">Designer</span>
                </div>
                <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 ml-1"></i>
              </div>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500">Designer</p>
                  </div>
                  <button onClick={() => { setShowProfileDropdown(false); handleSectionChange('profile-settings-section'); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <i className="fa-regular fa-user text-blue-600"></i> Profile Settings
                  </button>
                  <div className="border-t border-slate-200"></div>
                  <button onClick={() => { setShowProfileDropdown(false); signOut(); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT - Will be populated with sections */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeSection === 'overview-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">System Overview Dashboard</h1>
                  <p className="text-xs text-slate-500">Welcome back! Here's a live summary of your design operations and factory metrics.</p>
                </div>
                <div className="date-badge text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm">
                  <i className="fa-regular fa-calendar-days text-blue-600 mr-1"></i> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Upper Metric Cards Grid */}
              <div className="grid grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Projects</span>
                    <span className="text-2xl font-bold text-slate-900 block">34</span>
                    <span className="text-[10px] text-green-500 font-semibold"><i className="fa-solid fa-arrow-trend-up"></i> +12% this week</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-diagram-project"></i></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                    <span className="text-2xl font-bold text-slate-900 block">16</span>
                    <span className="text-[10px] text-amber-500 font-semibold"><i className="fa-regular fa-clock"></i> Awaiting client response</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-user-clock"></i></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sent to Production</span>
                    <span className="text-2xl font-bold text-slate-900 block">142</span>
                    <span className="text-[10px] text-blue-500 font-semibold"><i className="fa-solid fa-circle-check"></i> 7 items in queue</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-industry"></i></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Efficiency Rate</span>
                    <span className="text-2xl font-bold text-slate-900 block">94.8%</span>
                    <span className="text-[10px] text-green-500 font-semibold"><i className="fa-solid fa-bolt"></i> Optimal operational level</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl shadow-inner"><i className="fa-solid fa-gauge-high"></i></div>
                </div>
              </div>

              {/* Placeholder for chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-chart-line text-blue-600"></i> Analytics: Order Volume vs. Completion Rate</h3>
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm mt-4">Chart will be added with react-chartjs-2</div>
              </div>

              {/* Bottom Table Block (Recent Global Design Logs) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-list text-slate-500"></i> Recent Global Design Logs</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Live Feed</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Order No</th><th className="p-3">Client</th><th className="p-3">Project Title</th><th className="p-3">Designer</th><th className="p-3">Priority</th><th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {designs.slice(0, 5).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-blue-600">{d.orders?.order_no || '-'}</td>
                        <td className="p-3 font-bold text-slate-800">{d.orders?.clients?.name || '-'}</td>
                        <td className="p-3">{d.design_type || '-'}</td>
                        <td className="p-3">{profile?.username || 'Designer'}</td>
                        <td className="p-3"><span className={`priority-badge ${d.priority === 'High' ? 'priority-high' : d.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>{d.priority}</span></td>
                        <td className="p-3"><span className={`status-badge ${d.status === 'Pending' ? 'status-pending' : d.status === 'In Progress' ? 'status-progress' : d.status === 'Completed' ? 'status-completed' : 'status-cancelled'}`}>{d.status}</span></td>
                      </tr>
                    ))}
                    {designs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No recent activity</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                      {designs.filter(d => d.status === 'Pending' || d.status === 'In Progress').map((d) => (
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
                                    design_versions: designVersions || []
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
                      {designs.filter(d => d.status === 'Pending' || d.status === 'In Progress').length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            No design requests yet.
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

              {!selectedDesign ? (
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
                      <span>{designs.length}</span> registered
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-3 bg-slate-50/50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-list text-slate-500"></i> All Registered Design Projects
                      </h3>
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
                              !adsSearchQuery || 
                              d.orders?.order_no?.toLowerCase().includes(adsSearchQuery.toLowerCase()) ||
                              d.orders?.clients?.name?.toLowerCase().includes(adsSearchQuery.toLowerCase()) ||
                              d.design_type?.toLowerCase().includes(adsSearchQuery.toLowerCase())
                            )
                            .map((d, index) => (
                            <tr key={d.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => setSelectedDesign(d)}>
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
                          {designs.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                No design requests yet.
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
                    {myTasks.map((d) => (
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
                    {myTasks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No tasks assigned yet.
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
                  <p className="text-xs text-slate-500">Designs awaiting customer approval</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-user-check text-4xl mb-4"></i>
                <p className="text-sm">No designs awaiting customer approval</p>
              </div>
            </div>
          )}

          {activeSection === 'profile-settings-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Profile Settings</h1>
                  <p className="text-xs text-slate-500">Manage your account settings and preferences</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">{initials}</div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                    <p className="text-sm text-slate-500">Designer</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Username</label>
                    <input type="text" value={profile?.username || ''} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</label>
                    <input type="email" value={profile?.email || ''} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</label>
                    <input type="text" value={profile?.role || 'Designer'} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</label>
                    <input type="text" value={profile?.departments?.name || 'Design Department'} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600" />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Current Password</label>
                      <input type="password" placeholder="Enter current password" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">New Password</label>
                      <input type="password" placeholder="Enter new password" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Confirm New Password</label>
                      <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                  <p className="text-xs text-slate-500">View your system notifications</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-bell text-4xl mb-4"></i>
                <p className="text-sm">No new notifications</p>
              </div>
            </div>
          )}

          {activeSection === 'private-messages-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Messages</h1>
                  <p className="text-xs text-slate-500">Private messaging with team members</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-envelope text-4xl mb-4"></i>
                <p className="text-sm">Messaging system will be implemented here</p>
              </div>
            </div>
          )}

          {activeSection === 'production-files-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Production Files</h1>
                  <p className="text-xs text-slate-500">Manage production-ready design files</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-folder-open text-4xl mb-4"></i>
                <p className="text-sm">Production files management coming soon</p>
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
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-print text-4xl mb-4"></i>
                <p className="text-sm">Production queue management coming soon</p>
              </div>
            </div>
          )}

          {activeSection === 'design-library-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Design Library</h1>
                  <p className="text-xs text-slate-500">Browse and manage design assets</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-book-open text-4xl mb-4"></i>
                <p className="text-sm">Design library coming soon</p>
              </div>
            </div>
          )}

          {activeSection === 'reports-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Reports</h1>
                  <p className="text-xs text-slate-500">View analytics and reports</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-chart-bar text-4xl mb-4"></i>
                <p className="text-sm">Reports coming soon</p>
              </div>
            </div>
          )}

          {activeSection === 'notes-section' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Notes</h1>
                  <p className="text-xs text-slate-500">Manage your notes and memos</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <i className="fa-solid fa-sticky-note text-4xl mb-4"></i>
                <p className="text-sm">Notes management coming soon</p>
              </div>
            </div>
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
    </div>
  );
}