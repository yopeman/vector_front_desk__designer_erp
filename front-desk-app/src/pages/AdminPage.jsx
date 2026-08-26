import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

// ── API Base URL for user management ──
const API_URL = 'https://vecotr-advert-hr.vercel.app/api/frontdesk/users';

// ── Modal Component ──
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);

  // Modal state
  const [deptModal, setDeptModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', data: dept }
  const [userModal, setUserModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', data: user }

  // ── Search ──
  const [deptSearch, setDeptSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

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
    // The API returns all users (no server-side pagination), so fetch once on mount only.
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
      setUsers(result.data?.filter(u=>u.role!=='admin') || []);
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
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        showToast('Current password is incorrect', 'error');
        return;
      }

      // Current password is correct, now update to new password
      const { error } = await supabase.auth.updateUser({
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
  }, [userSearch]);

  // ── Client-side filtering (server does not support search) ──
  const filteredUsers = userSearch
    ? users.filter((u) =>
        (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800" style={{ color: '#00ced1' }}>V☰CTOR Advert & Manufacturing</h1>
            <p className="text-xs text-gray-500 mt-0.5">Welcome, {profile?.username || 'Admin'}</p>
          </div>
        </div>
        <button onClick={signOut} className="text-sm text-red-600 hover:text-red-800 font-medium">Sign Out</button>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'users'
                ? 'text-gray-800 border-b-2 border-[#00ced1]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'reports'
                ? 'text-gray-800 border-b-2 border-[#00ced1]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'text-gray-800 border-b-2 border-[#00ced1]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'users' && (
          <div>
            <center className='font-bold'><h1 style={{fontSize: '48px'}}><u>Users</u></h1></center>
            <div>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none w-full max-w-[calc(100%-12%)]"
                  style={{ transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#00ced1'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  onClick={() => setUserModal({ mode: 'create' })}
                  className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                  style={{ backgroundColor: '#00ced1' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#00b8bb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#00ced1'}
                >
                  <span className="text-base leading-none">+</span> Add User
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-gray-600">Name</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Email</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Role</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageUsers.map((u) => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{u.username || 'Unknown'}</td>
                        <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${!u.role ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                            {u.role || 'pending'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button onClick={() => setUserModal({ mode: 'edit', data: u })}
                            className="text-xs font-semibold px-2.5 py-1 rounded transition"
                            style={{ color: '#00ced1' }}
                            onMouseEnter={(e) => { e.target.style.color = '#00b8bb'; e.target.style.backgroundColor = '#e6fffd'; }}
                            onMouseLeave={(e) => { e.target.style.color = '#00ced1'; e.target.style.backgroundColor = 'transparent'; }}>
                            Edit
                          </button>
                          <button onClick={() => deleteUser(u.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1 rounded hover:bg-red-50 transition">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pageUsers.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                <div className="text-sm text-gray-600">
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
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
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
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setUserCurrentPage(userCurrentPage - 1)}
                    disabled={userCurrentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {userCurrentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setUserCurrentPage(userCurrentPage + 1)}
                    disabled={userCurrentPage >= totalPages}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setUserCurrentPage(totalPages)}
                    disabled={userCurrentPage >= totalPages}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
            <center className='font-bold'><h1 style={{fontSize: '48px'}}><u>Report</u></h1></center>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Front Desk', url: 'https://vectoradvert.com/erp/frontdesk/#/frontdesk-public-report' },
                { name: 'Design', url: 'https://vectoradvert.com/erp/frontdesk/#/design-public-report' },
                { name: 'Machine', url: 'https://vectoradvert.com/erp/machine/#machine-public-report' },
                { name: 'Finishing', url: 'https://vectoradvert.com/erp/machine/#machine-public-report' },
                { name: 'Marketing', url: 'https://vectoradvert.com/erp/marketing/#/marketing-public-report' },
                { name: 'Creative', url: 'https://vectoradvert.com/erp/creative/#/creative-public-report' },
              ].map((report) => (
                <a
                  key={report.name}
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition hover:border-[#00ced1]"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{report.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{report.url}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <center className='font-bold'><h1 style={{fontSize: '48px'}}><u>Profile</u></h1></center>
            <div className="mt-8 max-w-2xl mx-auto">
              {/* Admin Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                    <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">{profile?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">{profile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                    <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">COO</p>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
                <form onSubmit={changePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ transition: 'all 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ transition: 'all 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ transition: 'all 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
                      style={{ backgroundColor: '#00ced1' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#00b8bb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#00ced1'}
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

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
          <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
          <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
            required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Password {mode === 'edit' && <span className="font-normal text-gray-400">(optional)</span>}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={mode === 'create'}
            minLength={6}
            placeholder={mode === 'edit' ? 'Keep blank to leave unchanged' : ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="" disabled>— Select Role —</option>
            <option value="front_desk">Front Desk</option>
            <option value="designer">Designer</option>
            <option value="machine_operator">Machine Operator</option>
            <option value="finish">Finishing</option>
            <option value="marketer">Marketer</option>
            {/* <option value="admin_marketer">Admin Marketer</option> */}
            {/* <option value="finance">Finance</option> */}
            <option value="creative">Creative</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: '#00ced1' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00b8bb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#00ced1'}
          >{mode === 'edit' ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}