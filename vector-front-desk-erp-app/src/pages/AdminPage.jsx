import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

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
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('departments');
  const [toast, setToast] = useState(null);

  // Modal state
  const [deptModal, setDeptModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', data: dept }
  const [userModal, setUserModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', data: user }

  // ── Search ──
  const [deptSearch, setDeptSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // ── Pagination ──
  const [deptCurrentPage, setDeptCurrentPage] = useState(1);
  const [deptItemsPerPage, setDeptItemsPerPage] = useState(10);
  const [deptTotalCount, setDeptTotalCount] = useState(0);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [userTotalCount, setUserTotalCount] = useState(0);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [deptCurrentPage, deptItemsPerPage, userCurrentPage, userItemsPerPage]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Departments ──

  async function fetchDepartments() {
    const from = (deptCurrentPage - 1) * deptItemsPerPage;
    const to = from + deptItemsPerPage - 1;

    let query = supabase.from('departments').select('*', { count: 'exact' }).order('name');

    if (deptSearch) {
      query = query.ilike('name', `%${deptSearch}%`);
    }

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }
    setDepartments(data || []);
    setDeptTotalCount(count || 0);
  }

  async function saveDepartment(form) {
    if (deptModal?.mode === 'edit') {
      const { error } = await supabase
        .from('departments')
        .update({ name: form.name, description: form.description, updated_at: new Date().toISOString() })
        .eq('id', deptModal.data.id);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Department updated');
    } else {
      const { error } = await supabase.from('departments').insert({ name: form.name, description: form.description });
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Department created');
    }
    setDeptModal(null);
    fetchDepartments();
  }

  async function deleteDepartment(id) {
    if (!window.confirm('Are you sure you want to delete this department? Users assigned to it will have their department set to none.')) return;
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Department deleted');
    fetchDepartments();
  }

  // ── Users ──

  async function fetchUsers() {
    const from = (userCurrentPage - 1) * userItemsPerPage;
    const to = from + userItemsPerPage - 1;

    let query = supabase.from('users').select('*, departments(name)', { count: 'exact' }).order('username');

    if (userSearch) {
      query = query.or(`username.ilike.%${userSearch}%,email.ilike.%${userSearch}%`);
    }

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    setUsers(data || []);
    setUserTotalCount(count || 0);
  }

  async function saveUser(form) {
    if (userModal?.mode === 'edit') {
      const updates = {
        username: form.username,
        email: form.email,
        role: form.role,
        department_id: form.department_id || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('users').update(updates).eq('id', userModal.data.id);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('User updated');
    } else {
      if (!form.password) { showToast('Password is required', 'error'); return; }
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) { showToast(authError.message, 'error'); return; }
      if (authData.user) {
        const { error } = await supabase.from('users').upsert({
          id: authData.user.id, username: form.username, email: form.email,
          role: form.role, department_id: form.department_id || null,
        });
        if (error) { showToast(error.message, 'error'); return; }
      }
      showToast('User created');
    }
    setUserModal(null);
    fetchUsers();
  }

  async function deleteUser(id) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('User deleted');
    fetchUsers();
  }

  // ── Reset page on search change ──
  useEffect(() => {
    setDeptCurrentPage(1);
  }, [deptSearch]);

  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearch]);

  // ── Render ──

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold" style={{ color: '#00ced1' }}>V</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">V☰CTOR</h1>
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200 pb-2">
          <button onClick={() => setActiveTab('departments')}
            className={`text-sm font-semibold pb-2 px-1 transition ${activeTab === 'departments' ? 'border-b-2' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'departments' ? { color: '#00ced1', borderColor: '#00ced1' } : {}}>
            Departments {deptTotalCount > 0 && <span className="ml-1 text-xs text-gray-400">({deptTotalCount})</span>}
          </button>
          <button onClick={() => setActiveTab('users')}
            className={`text-sm font-semibold pb-2 px-1 transition ${activeTab === 'users' ? 'border-b-2' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'users' ? { color: '#00ced1', borderColor: '#00ced1' } : {}}>
            Users {userTotalCount > 0 && <span className="ml-1 text-xs text-gray-400">({userTotalCount})</span>}
          </button>
        </div>

        {/* ─── DEPARTMENTS ─── */}
        {activeTab === 'departments' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <input
                type="text"
                placeholder="Search departments..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none w-full max-w-xs"
                style={{ transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#00ced1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                onClick={() => setDeptModal({ mode: 'create' })}
                className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                style={{ backgroundColor: '#00ced1' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#00b8bb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#00ced1'}
              >
                <span className="text-base leading-none">+</span> Add Department
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-gray-600">Name</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Description</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{d.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{d.description || '—'}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button onClick={() => setDeptModal({ mode: 'edit', data: d })}
                          className="text-xs font-semibold px-2.5 py-1 rounded transition"
                          style={{ color: '#00ced1' }}
                          onMouseEnter={(e) => { e.target.style.color = '#00b8bb'; e.target.style.backgroundColor = '#e6fffd'; }}
                          onMouseLeave={(e) => { e.target.style.color = '#00ced1'; e.target.style.backgroundColor = 'transparent'; }}>
                          Edit
                        </button>
                        <button onClick={() => deleteDepartment(d.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1 rounded hover:bg-red-50 transition">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400">No departments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              <div className="text-sm text-gray-600">
                Showing {(deptCurrentPage - 1) * deptItemsPerPage + 1}-{Math.min(deptCurrentPage * deptItemsPerPage, deptTotalCount)} of {deptTotalCount} departments
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={deptItemsPerPage}
                  onChange={(e) => setDeptItemsPerPage(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button
                  onClick={() => setDeptCurrentPage(1)}
                  disabled={deptCurrentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  First
                </button>
                <button
                  onClick={() => setDeptCurrentPage(deptCurrentPage - 1)}
                  disabled={deptCurrentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {deptCurrentPage} of {Math.ceil(deptTotalCount / deptItemsPerPage) || 1}
                </span>
                <button
                  onClick={() => setDeptCurrentPage(deptCurrentPage + 1)}
                  disabled={deptCurrentPage >= Math.ceil(deptTotalCount / deptItemsPerPage)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setDeptCurrentPage(Math.ceil(deptTotalCount / deptItemsPerPage))}
                  disabled={deptCurrentPage >= Math.ceil(deptTotalCount / deptItemsPerPage)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── USERS ─── */}
        {activeTab === 'users' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none w-full max-w-xs"
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
                    <th className="px-5 py-3 font-semibold text-gray-600">Department</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{u.username || 'Unknown'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${!u.role ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                          {u.role || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{u.departments?.name || '—'}</td>
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
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              <div className="text-sm text-gray-600">
                Showing {(userCurrentPage - 1) * userItemsPerPage + 1}-{Math.min(userCurrentPage * userItemsPerPage, userTotalCount)} of {userTotalCount} users
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={userItemsPerPage}
                  onChange={(e) => setUserItemsPerPage(Number(e.target.value))}
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
                  Page {userCurrentPage} of {Math.ceil(userTotalCount / userItemsPerPage) || 1}
                </span>
                <button
                  onClick={() => setUserCurrentPage(userCurrentPage + 1)}
                  disabled={userCurrentPage >= Math.ceil(userTotalCount / userItemsPerPage)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setUserCurrentPage(Math.ceil(userTotalCount / userItemsPerPage))}
                  disabled={userCurrentPage >= Math.ceil(userTotalCount / userItemsPerPage)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── DEPARTMENT MODAL ─── */}
      {deptModal && (
        <DeptModal
          mode={deptModal.mode}
          data={deptModal.data}
          onSave={saveDepartment}
          onClose={() => setDeptModal(null)}
        />
      )}

      {/* ─── USER MODAL ─── */}
      {userModal && (
        <UserModal
          mode={userModal.mode}
          data={userModal.data}
          departments={departments}
          onSave={saveUser}
          onClose={() => setUserModal(null)}
        />
      )}
    </div>
  );
}

// ── Department Modal ──
function DeptModal({ mode, data, onSave, onClose }) {
  const [form, setForm] = useState({ name: data?.name || '', description: data?.description || '' });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <Modal title={mode === 'edit' ? 'Edit Department' : 'New Department'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
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

// ── User Modal ──
function UserModal({ mode, data, departments, onSave, onClose }) {
  const [form, setForm] = useState({
    username: data?.username || '',
    email: data?.email || '',
    password: '',
    role: data?.role || 'front_desk',
    department_id: data?.department_id || '',
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
        {mode === 'create' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              required minLength={6} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ transition: 'all 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="">— No role (pending) —</option>
            <option value="front_desk">Front Desk Officer</option>
            <option value="designer">Designer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
          <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ transition: 'all 0.2s' }}
            onFocus={(e) => { e.target.style.borderColor = '#00ced1'; e.target.style.boxShadow = '0 0 0 2px #e6fffd'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
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