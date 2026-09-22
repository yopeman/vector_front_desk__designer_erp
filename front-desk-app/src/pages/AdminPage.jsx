import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import FloatingAssistant from './front-desk/components/FloatingAssistant';
import MessagesPage from './front-desk/components/MessagesPage';
import NotificationsPage from './front-desk/components/NotificationsPage';
import NotesPage from './front-desk/components/NotesPage';
import AdminNotifications from './AdminNotifications';

// ── API Base URL for user management ──
const API_URL = 'https://vecotr-advert-hr.vercel.app/api/frontdesk/users';
const KPI_URL = 'https://vecotr-advert-hr.vercel.app/api/frontdesk/kpis';

// ── Sidebar ──
function AdminSidebar({ activeTab, onTabSwitch }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', color: 'text-primary-400' },
    { id: 'users', label: 'Users', icon: 'fa-users', color: 'text-primary-400' },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-bar', color: 'text-primary-400' },
    { id: 'ai-agent', label: 'AI Agent', icon: 'fa-robot', color: 'text-primary-400' },
    { id: 'messages', label: 'Message', icon: 'fa-envelope', color: 'text-primary-400' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell', color: 'text-primary-400' },
    { id: 'notes', label: 'Notes', icon: 'fa-sticky-note', color: 'text-primary-400' },
    { id: 'profile', label: 'Settings', icon: 'fa-gear', color: 'text-primary-400' },
  ];

  return (
    <aside className="w-68 bg-primary-900 text-slate-200 flex flex-col justify-between hidden md:flex z-10 shadow-2xl shrink-0">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-primary-800 bg-primary-950/40">
          <div className="bg-gradient-to-tr from-primary-500 to-primary-600 p-2.5 rounded-xl text-white shadow-md shadow-primary-500/20">
            <i className="fa-solid fa-cubes text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white tracking-wide">V☰CTOR A&M</h1>
            <span className="text-xs text-primary-400 font-semibold tracking-wider uppercase">ERP Premium v2.0</span>
          </div>
        </div>

        <div className="p-4 pt-6 text-xs font-bold text-slate-500 uppercase tracking-widest px-6">Admin Modules</div>
        <nav className="p-4 space-y-1.5 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabSwitch(tab.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-600/10'
                  : 'text-slate-400 hover:bg-primary-800 hover:text-slate-100'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-base ${tab.color || ''}`}></i>
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => window.open('https://vectoradvert.com/erp/hr', '_self')}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left text-slate-400 hover:bg-primary-800 hover:text-slate-100"
          >
            <i className="fa-solid fa-file-lines text-base text-primary-400"></i>
            HR Request
          </button>
        </nav>
      </div>
    </aside>
  );
}

// ── Topbar ──
function AdminHeader({ profile, signOut }) {
  return (
    <header className="bg-white border-b border-primary-100 h-16 flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 z-30 shadow-sm">
      <h1 className="text-lg font-bold text-slate-800">V☰CTOR Advert & Manufacturing</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold border border-slate-700">
              {(profile?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="font-semibold text-slate-800 text-sm truncate">{profile?.email || 'admin@company.com'}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-500">Active Session</p>
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-600 rounded-full text-[10px] font-bold uppercase">
                Admin
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 text-slate-300 rounded-lg transition text-xs font-semibold"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
        <AdminNotifications />
      </div>
    </header>
  );
}

// ── Modal Component ──
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition';

export default function AdminPage() {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  // ── KPIs ──
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpiError, setKpiError] = useState(null);

  // Modal state
  const [deptModal, setDeptModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', data: dept }
  const [userModal, setUserModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', data: user }

  // ── Search ──
  const [deptSearch, setDeptSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // ── Pagination ──
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);

  // ── Profile Password Change ──
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchKpis();
    // The API returns all users (no server-side pagination), so fetch once on mount only.
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── KPIs ──

  async function fetchKpis() {
    setKpisLoading(true);
    setKpiError(null);
    try {
      const res = await fetch(KPI_URL);
      const result = await res.json();
      if (!result.success) {
        setKpiError(result.error || 'Failed to load KPIs');
        return;
      }
      setKpis(result.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setKpiError(error.message);
    } finally {
      setKpisLoading(false);
    }
  }

  // ── Users ──

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}`);
      const result = await res.json();
      if (!result.success) {
        console.error('Error fetching users:', result.error);
        return;
      }
      setUsers(result.data?.filter(u=>u.role!=='admin' && u.role!=='finance') || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function saveUser(form) {
    try {
      if (userModal?.mode === 'edit') {
        const payload = {
          username: form.username,
          email: form.email,
          role: form.role,
        };
        if (form.password) {
          payload.password = form.password;
        }
        const res = await fetch(`${API_URL}?id=${userModal.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!result.success) { showToast(result.error, 'error'); return; }
        showToast('User updated');
      } else {
        if (!form.password) { showToast('Password is required', 'error'); return; }
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            username: form.username,
            role: form.role,
          }),
        });
        const result = await res.json();
        if (!result.success) { showToast(result.error, 'error'); return; }
        showToast('User created');
      }
      setUserModal(null);
      fetchUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) { showToast(result.error, 'error'); return; }
      showToast('User deleted');
      fetchUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    
    if (!passwordForm.currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      // Verify current password by attempting to sign in
      const { data: { user } } = await supabaseAdmin.auth.getUser();
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        showToast('Current password is incorrect', 'error');
        return;
      }

      // Current password is correct, now update to new password
      const { error } = await supabaseAdmin.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showToast('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Error changing password: ' + error.message, 'error');
    }
  }

  // ── Reset page on search change ──
  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearch, userRoleFilter]);

  // ── Client-side filtering (server does not support search) ──
  const filteredUsers = users.filter((u) => {
    const matchesRole =
      userRoleFilter === 'all' ||
      (userRoleFilter === 'pending' ? !u.role : u.role === userRoleFilter);
    if (!matchesRole) return false;
    if (!userSearch) return true;
    return (
      (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  // ── Client-side pagination (server does not support pagination) ──
  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / userItemsPerPage));
  const startIndex = (userCurrentPage - 1) * userItemsPerPage;
  const endIndex = Math.min(startIndex + userItemsPerPage, totalFiltered);
  const pageUsers = filteredUsers.slice(startIndex, endIndex);

  // Keep the current page valid when the data shrinks (e.g. after a delete).
  useEffect(() => {
    if (userCurrentPage > totalPages) {
      setUserCurrentPage(totalPages);
    }
  }, [totalPages, userCurrentPage]);

  // ── Render ──

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 text-slate-800 antialiased">
      <AdminSidebar activeTab={activeTab} onTabSwitch={setActiveTab} />

      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
        <AdminHeader profile={profile} signOut={signOut} />

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-error-500' : 'bg-primary-500'}`}>
            {toast.msg}
          </div>
        )}

        <div className="p-6 md:p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <KpiDashboard data={kpis} loading={kpisLoading} error={kpiError} onRetry={fetchKpis} />
          )}

          {activeTab === 'users' && (
            <div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className={`${inputClass} flex-1 min-w-[10rem]`}
                    />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className={`${inputClass} w-auto min-w-[160px] shrink-0`}
                    >
                      <option value="all">All Roles</option>
                      {/* <option value="pending">Pending</option> */}
                      <option value="front_desk">Front Desk</option>
                      <option value="designer">Designer</option>
                      <option value="machine_operator">Machine Operator</option>
                      <option value="admin_machine_operator">Super Machine Operator</option>
                      <option value="finish">Finishing</option>
                      <option value="marketer">Marketer</option>
                      <option value="admin_marketer">Super Marketer</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setUserModal({ mode: 'create' })}
                    className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                  >
                    <span className="text-base leading-none">+</span> Add User
                  </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-5 py-3 font-semibold text-slate-600">Name</th>
                        <th className="px-5 py-3 font-semibold text-slate-600">Email</th>
                        <th className="px-5 py-3 font-semibold text-slate-600">Role</th>
                        <th className="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageUsers.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-3.5 font-medium text-slate-800">{u.username || 'Unknown'}</td>
                          <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${!u.role ? 'bg-warning-50 text-warning-700' : 'bg-primary-50 text-primary-700'}`}>
                              {u.role || 'pending'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1">
                            <button onClick={() => setUserModal({ mode: 'edit', data: u })}
                              className="text-primary-600 hover:text-primary-800 hover:bg-primary-50 text-xs font-semibold px-2.5 py-1 rounded transition">
                              Edit
                            </button>
                            <button onClick={() => deleteUser(u.id)}
                              className="text-error-600 hover:text-error-800 text-xs font-semibold px-2.5 py-1 rounded hover:bg-error-50 transition">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pageUsers.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <div className="text-sm text-slate-600">
                    {totalFiltered === 0
                      ? 'Showing 0 users'
                      : `Showing ${startIndex + 1}-${endIndex} of ${totalFiltered} users`}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={userItemsPerPage}
                      onChange={(e) => {
                        setUserItemsPerPage(Number(e.target.value));
                        setUserCurrentPage(1);
                      }}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <button
                      onClick={() => setUserCurrentPage(1)}
                      disabled={userCurrentPage === 1}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setUserCurrentPage(userCurrentPage - 1)}
                      disabled={userCurrentPage === 1}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-slate-600">
                      Page {userCurrentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setUserCurrentPage(userCurrentPage + 1)}
                      disabled={userCurrentPage >= totalPages}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setUserCurrentPage(totalPages)}
                      disabled={userCurrentPage >= totalPages}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-800">COO Reports</h2>
                  <p className="text-xs text-slate-500 mt-1">Open a live public report from any department in a new tab</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { name: 'Front Desk Report', icon: 'fa-headset', gradient: 'from-primary-500 to-primary-600', desc: 'Orders, payments & daily front desk activity', url: 'https://vectoradvert.com/erp/frontdesk/#/frontdesk-public-report' },
                    { name: 'Design Report', icon: 'fa-compass-drafting', gradient: 'from-accent-500 to-accent-700', desc: 'Design outputs, BOMs and creative work', url: 'https://vectoradvert.com/erp/frontdesk/#/design-public-report' },
                    { name: 'Machine Report', icon: 'fa-gears', gradient: 'from-warning-500 to-warning-700', desc: 'Machine operations and production lines', url: 'https://vectoradvert.com/erp/machine/#machine-public-report' },
                    { name: 'Finishing Report', icon: 'fa-spray-can-sparkles', gradient: 'from-secondary-600 to-secondary-800', desc: 'Finishing stage progress and output', url: 'https://vectoradvert.com/erp/machine/#machine-public-report' },
                    { name: 'Marketing Report', icon: 'fa-bullhorn', gradient: 'from-error-500 to-error-700', desc: 'Campaigns, leads and marketing performance', url: 'https://vectoradvert.com/erp/marketing/#/marketing-public-report' },
                    { name: 'Creative Report', icon: 'fa-palette', gradient: 'from-success-500 to-success-700', desc: 'Creative department activities and ideas', url: 'https://vectoradvert.com/erp/creative/#/creative-public-report' },
                  ].map((report) => (
                    <a
                      key={report.name}
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-500 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`bg-gradient-to-br ${report.gradient} p-3 rounded-xl text-white shadow-md`}>
                          <i className={`fa-solid ${report.icon} text-xl`}></i>
                        </div>
                        <span className="text-slate-300 group-hover:text-primary-500 transition-colors">
                          <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-1.5">{report.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{report.desc}</p>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-primary-600 group-hover:text-primary-500">
                        <span>Open Report</span>
                        <i className="fa-solid fa-chevron-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && <MessagesPage />}

          {activeTab === 'notifications' && <NotificationsPage />}

          {activeTab === 'notes' && <NotesPage />}

          {activeTab === 'profile' && (
            <div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Admin Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                    <p className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded-lg">{profile?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <p className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded-lg">{profile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                    <p className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded-lg">COO</p>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h2>
                <form onSubmit={changePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'ai-agent' && (
            <div className="h-[calc(100vh-160px)] flex">
              <FloatingAssistant onNavigate={(action) => {
                const map = {
                  'report': 'reports',
                  'reports': 'reports',
                  'messages': 'messages',
                  'notifications': 'notifications',
                  'notes': 'notes',
                  'settings': 'profile',
                };
                setActiveTab(map[action] || 'users');
              }} embedded />
            </div>
          )}
        </div>
      </main>

      {/* ─── USER MODAL ─── */}
      {userModal && (
        <UserModal
          mode={userModal.mode}
          data={userModal.data}
          onSave={saveUser}
          onClose={() => setUserModal(null)}
        />
      )}
    </div>
  );
}

// ── KPI Dashboard ──
function StatCard({ label, value, sub, icon, gradient }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`bg-gradient-to-br ${gradient || 'from-primary-500 to-primary-600'} p-2.5 rounded-lg text-white shadow-md`}>
          <i className={`fa-solid ${icon} text-base`}></i>
        </div>
        {sub && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function KpiSection({ title, icon, gradient, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`px-5 py-3.5 bg-gradient-to-r ${gradient} flex items-center gap-3`}>
        <i className={`fa-solid ${icon} text-white text-sm`}></i>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KpiDashboard({ data, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-500">Loading KPIs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <i className="fa-solid fa-triangle-exclamation text-3xl text-error-500 mb-3"></i>
        <p className="text-sm font-semibold text-slate-700 mb-1">Failed to load KPIs</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const d = data.departments;
  const frontDesk = d.frontDesk;
  const production = d.production;
  const machine = d.machine;
  const design = d.design;
  const marketing = d.marketing;
  const creative = d.creative;
  const finishing = d.finishing;
  const maintenance = d.maintenance;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Live overview across all departments — last updated{' '}
            {new Date(data.generated_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-3 py-2 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition flex items-center gap-1.5"
        >
          <i className="fa-solid fa-rotate text-xs"></i> Refresh
        </button>
      </div>

      {/* Top-level stat row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Clients" value={frontDesk.inquiries.totalClients} icon="fa-user-group" gradient="from-primary-500 to-primary-600" />
        <StatCard label="Total Leads" value={frontDesk.inquiries.leads} icon="fa-filter" gradient="from-accent-500 to-accent-700" />
        <StatCard label="Total Orders" value={frontDesk.orders.total} sub={`${frontDesk.orders.thisMonth} this month`} icon="fa-box" gradient="from-warning-500 to-warning-700" />
        <StatCard label="Total Quotations" value={frontDesk.quotations.total} sub={`${frontDesk.quotations.thisMonth} this month`} icon="fa-file-invoice" gradient="from-secondary-600 to-secondary-800" />
        <StatCard label="Active Jobs" value={production.activeJobs} sub={`${production.activeJobOrders} job orders`} icon="fa-industry" gradient="from-error-500 to-error-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Front Desk */}
        <KpiSection title="Front Desk" icon="fa-headset" gradient="from-primary-500 to-primary-600">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Site Visits" value={frontDesk.inquiries.siteVisits} icon="fa-location-dot" gradient="from-primary-400 to-primary-600" />
            <StatCard label="Pending Designs Approval" value={frontDesk.approvals.pendingDesigns} icon="fa-circle-check" gradient="from-warning-400 to-warning-600" />
            <StatCard label="Pending Proforma Invoices" value={frontDesk.approvals.pendingProformaInvoices} icon="fa-file-invoice-dollar" gradient="from-accent-400 to-accent-700" />
            <StatCard label="Orders (New)" value={frontDesk.orders.byStatus.New || 0} icon="fa-box-open" gradient="from-secondary-500 to-secondary-700" />
            <StatCard label="Follow-ups Due" value={frontDesk.followUps.due} icon="fa-clock" gradient="from-warning-500 to-warning-700" />
            <StatCard label="Pending Site Visits" value={frontDesk.followUps.pendingSiteVisits} icon="fa-calendar-days" gradient="from-success-500 to-success-700" />
          </div>
        </KpiSection>

        {/* Production */}
        <KpiSection title="Production" icon="fa-industry" gradient="from-error-500 to-error-700">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Active Production Orders" value={production.activeProductionOrders} icon="fa-layer-group" gradient="from-error-400 to-error-600" />
            <StatCard label="In Progress" value={production.progress.inProgress} icon="fa-spinner" gradient="from-warning-500 to-warning-700" />
            <StatCard label="In Production" value={production.progress.inProduction} icon="fa-bolt" gradient="from-accent-500 to-accent-700" />
            <StatCard label="Completed (This Month)" value={production.output.completedThisMonth} icon="fa-circle-check" gradient="from-success-500 to-success-700" />
            <StatCard label="Completed Jobs" value={production.output.completedJobs} icon="fa-box-check" gradient="from-primary-400 to-primary-600" />
            <StatCard label="Active Delays" value={production.delays} icon="fa-triangle-exclamation" gradient="from-warning-500 to-warning-700" />
          </div>
        </KpiSection>

        {/* Machine */}
        <KpiSection title="Machine" icon="fa-gears" gradient="from-slate-600 to-slate-800">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">Utilization</p>
            <div className="flex items-end justify-between gap-2">
              {machine.utilization.byStatus && Object.entries(machine.utilization.byStatus).map(([k, v]) => (
                <div key={k} className="text-center">
                  <p className="text-lg font-bold text-slate-800">{v}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{k.replace(/_/g, ' ')}</p>
                </div>
              ))}
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{machine.utilization.active}</p>
                <p className="text-[10px] text-slate-400 uppercase">Active</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {(machine.output || []).map((m) => (
              <div key={m.machine} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                <span className="font-semibold text-slate-700">{m.machine}</span>
                <span className="text-xs text-slate-500">
                  {m.jobs} jobs · {m.completed} completed
                </span>
              </div>
            ))}
            {(!machine.output || machine.output.length === 0) && (
              <p className="text-xs text-slate-400">No machine output recorded.</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="px-2 py-3 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-800">{machine.downtime.machinesInMaintenance || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">In Maintenance</p>
            </div>
            <div className="px-2 py-3 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-800">{machine.downtime.maintenanceLogs || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Maintenance Logs</p>
            </div>
            <div className="px-2 py-3 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-800">{machine.waste.reworkJobs || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Rework Jobs</p>
            </div>
          </div>
        </KpiSection>

        {/* Design */}
        <KpiSection title="Design" icon="fa-compass-drafting" gradient="from-accent-500 to-accent-700">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Requests" value={design.requests.total} sub={`${design.requests.thisMonth} this month`} icon="fa-pen-ruler" gradient="from-accent-400 to-accent-600" />
            <StatCard label="Completed" value={design.requests.byStatus.Completed || 0} icon="fa-circle-check" gradient="from-success-500 to-success-700" />
            <StatCard label="In Progress" value={design.requests.byStatus['In Progress'] || 0} icon="fa-spinner" gradient="from-warning-500 to-warning-700" />
            <StatCard label="Pending" value={design.requests.byStatus.Pending || 0} icon="fa-hourglass-half" gradient="from-warning-400 to-warning-600" />
            <StatCard label="Pending Approvals" value={design.approvals.pendingDesigns} icon="fa-stamp" gradient="from-primary-500 to-primary-600" />
            <StatCard label="Delays" value={design.delays} icon="fa-triangle-exclamation" gradient="from-error-500 to-error-700" />
            <StatCard label="Revisions Sent" value={design.revisions.total} icon="fa-wand-magic-sparkles" gradient="from-accent-500 to-accent-700" />
            <StatCard label="Avg Revisions / Design" value={design.revisions.averagePerDesign} icon="fa-list-check" gradient="from-secondary-500 to-secondary-700" />
          </div>
        </KpiSection>

        {/* Marketing */}
        <KpiSection title="Marketing" icon="fa-bullhorn" gradient="from-error-500 to-error-700">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Campaigns" value={marketing.campaigns.total} icon="fa-bullhorn" gradient="from-error-400 to-error-600" />
            <StatCard label="Active Campaigns" value={marketing.performance.activeCampaigns} icon="fa-tower-broadcast" gradient="from-warning-500 to-warning-700" />
            <StatCard label="Marketing Leads" value={marketing.leads.marketingLeads} icon="fa-user-plus" gradient="from-accent-500 to-accent-700" />
            <StatCard label="Campaign Target Achieved" value={marketing.performance.campaignTargetAchieved} icon="fa-bullseye" gradient="from-success-500 to-success-700" />
            <StatCard label="Proposals Submitted" value={marketing.conversion.proposalsSubmitted} icon="fa-file-lines" gradient="from-primary-500 to-primary-600" />
            <StatCard label="Proposal Conversion" value={`${marketing.conversion.proposalConversionRate}%`} icon="fa-percent" gradient="from-secondary-500 to-secondary-700" />
            <StatCard label="Tenders Awarded" value={marketing.conversion.tendersAwarded} icon="fa-award" gradient="from-success-500 to-success-700" />
            <StatCard label="Activities (Planned)" value={marketing.performance.activities.byStatus.planned || 0} icon="fa-calendar-check" gradient="from-warning-500 to-warning-700" />
          </div>
        </KpiSection>

        {/* Creative */}
        <KpiSection title="Creative" icon="fa-palette" gradient="from-success-500 to-success-700">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Ideas (Pending)" value={creative.ideas.total} icon="fa-lightbulb" gradient="from-success-400 to-success-600" />
            <StatCard label="Prototypes (Pending)" value={creative.prototypes.total} icon="fa-flask" gradient="from-accent-500 to-accent-700" />
            <StatCard label="Testing (Pending)" value={creative.testing.total} icon="fa-vial" gradient="from-warning-500 to-warning-700" />
            <StatCard label="Launches" value={creative.launches.launched} icon="fa-rocket" gradient="from-primary-500 to-primary-600" />
          </div>
        </KpiSection>

        {/* Finishing */}
        <KpiSection title="Finishing" icon="fa-spray-can-sparkles" gradient="from-secondary-500 to-secondary-700">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="In Progress" value={finishing.progress.inProgress} icon="fa-spinner" gradient="from-warning-500 to-warning-700" />
            <StatCard label="Pending" value={finishing.progress.pending} icon="fa-hourglass-half" gradient="from-secondary-400 to-secondary-600" />
            <StatCard label="Completed" value={finishing.completed} icon="fa-circle-check" gradient="from-success-500 to-success-700" />
            <StatCard label="Rework" value={finishing.rework.total} icon="fa-rotate-left" gradient="from-error-500 to-error-700" />
            <StatCard label="Quality Pass Rate" value={`${finishing.qualityControl.passRate}%`} icon="fa-check-double" gradient="from-primary-500 to-primary-600" />
          </div>
        </KpiSection>

        {/* Maintenance */}
        <KpiSection title="Maintenance" icon="fa-wrench" gradient="from-warning-500 to-warning-700">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Preventive Logs (This Month)" value={maintenance.preventive.thisMonth} icon="fa-clipboard-check" gradient="from-success-500 to-success-700" />
            <StatCard label="Breakdowns" value={maintenance.breakdowns} icon="fa-ban" gradient="from-error-500 to-error-700" />
            <StatCard label="Machines In Maintenance" value={maintenance.downtime.machinesInMaintenance} icon="fa-gear" gradient="from-warning-500 to-warning-700" />
            <StatCard label="Skipped Maintenance" value={maintenance.downtime.skippedMaintenance} icon="fa-calendar-xmark" gradient="from-error-500 to-error-700" />
          </div>
        </KpiSection>
      </div>
    </div>
  );
}

// ── User Modal ──
function UserModal({ mode, data, onSave, onClose }) {
  const [form, setForm] = useState({
    username: data?.username || '',
    email: data?.email || '',
    password: '',
    role: data?.role || 'front_desk',
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) return;
    onSave(form);
  }

  return (
    <Modal title={mode === 'edit' ? 'Edit User' : 'New User'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
            required className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            required className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password {mode === 'edit' && <span className="font-normal text-slate-400">(optional)</span>}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={mode === 'create'}
            minLength={6}
            placeholder={mode === 'edit' ? 'Keep blank to leave unchanged' : ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            <option value="" disabled>— Select Role —</option>
            <option value="front_desk">Front Desk</option>
            <option value="designer">Designer</option>
            <option value="machine_operator">Machine Operator</option>
            <option value="admin_machine_operator">Super Machine Operator</option>
            <option value="finish">Finishing</option>
            <option value="marketer">Marketer</option>
            <option value="admin_marketer">Super Marketer</option>
            <option value="creative">Creative</option>
            {/* <option value="finance">Finance</option> */}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition">
            {mode === 'edit' ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}