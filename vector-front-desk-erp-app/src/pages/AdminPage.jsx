import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function AdminPage() {
  const { signOut } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('departments');

  // Department form
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // User form
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('front_desk');
  const [userDept, setUserDept] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  async function fetchDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*, departments(name)')
      .order('username');
    if (data) setUsers(data);
  }

  async function addDepartment(e) {
    e.preventDefault();
    if (!deptName.trim()) return;
    await supabase.from('departments').insert({ name: deptName, description: deptDesc });
    setDeptName('');
    setDeptDesc('');
    fetchDepartments();
  }

  async function deleteDepartment(id) {
    await supabase.from('departments').delete().eq('id', id);
    fetchDepartments();
  }

  async function addUser(e) {
    e.preventDefault();
    if (!userEmail.trim() || !userPassword.trim() || !userName.trim()) return;

    // Sign up the user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userEmail,
      password: userPassword,
    });
    if (authError) {
      alert(authError.message);
      return;
    }

    // Insert profile into users table
    if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        username: userName,
        email: userEmail,
        role: userRole,
        department_id: userDept || null,
      });
    }

    setUserEmail('');
    setUserPassword('');
    setUserName('');
    setUserRole('front_desk');
    setUserDept('');
    fetchUsers();
  }

  async function deleteUser(id) {
    await supabase.from('users').delete().eq('id', id);
    fetchUsers();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('departments')}
            className={`text-sm font-semibold pb-2 px-1 ${
              activeTab === 'departments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`text-sm font-semibold pb-2 px-1 ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            Users
          </button>
        </div>

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Add Department
              </h2>
              <form onSubmit={addDepartment} className="space-y-3">
                <input
                  type="text"
                  placeholder="Department name"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Department
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Existing Departments
              </h2>
              {departments.length === 0 && (
                <p className="text-sm text-gray-400">No departments yet.</p>
              )}
              <ul className="space-y-2">
                {departments.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {d.name}
                      </p>
                      {d.description && (
                        <p className="text-xs text-gray-500">{d.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteDepartment(d.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Add User
              </h2>
              <form onSubmit={addUser} className="space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="front_desk">Front Desk Officer</option>
                  <option value="designer">Designer</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={userDept}
                  onChange={(e) => setUserDept(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add User
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Existing Users
              </h2>
              {users.length === 0 && (
                <p className="text-sm text-gray-400">No users yet.</p>
              )}
              <ul className="space-y-2">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {u.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {u.email} &middot; {u.role}
                        {u.departments?.name && (
                          <> &middot; {u.departments.name}</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}