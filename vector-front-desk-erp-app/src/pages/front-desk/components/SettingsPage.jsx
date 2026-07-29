import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    phone: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Appearance form state
  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'light',
    fontSize: 'medium',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: profileForm.username,
          email: profileForm.email,
          phone: profileForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword) {
      showMessage('error', 'Please enter your current password');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        showMessage('error', 'Current password is incorrect');
        setLoading(false);
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

      showMessage('success', 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Error changing password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save appearance settings to localStorage for now
      localStorage.setItem('appearance_settings', JSON.stringify(appearanceForm));
      
      // Apply theme
      if (appearanceForm.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      showMessage('success', 'Appearance settings saved');
    } catch (error) {
      console.error('Error saving appearance:', error);
      showMessage('error', 'Error saving appearance settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load saved appearance settings
    const savedAppearance = localStorage.getItem('appearance_settings');
    if (savedAppearance) {
      setAppearanceForm(JSON.parse(savedAppearance));
    }
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-user mr-2"></i>Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-lock mr-2"></i>Password
          </button>
          {/* <button
            onClick={() => setActiveTab('appearance')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-palette mr-2"></i>Appearance
          </button> */}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="max-w-lg">
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="max-w-lg">
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <form onSubmit={handleAppearanceSave} className="max-w-lg">
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-2">Theme</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={appearanceForm.theme === 'light'}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, theme: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Light</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={appearanceForm.theme === 'dark'}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, theme: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Dark</span>
                  </label>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-700 mb-2">Font Size</label>
                <select
                  value={appearanceForm.fontSize}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, fontSize: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors"
              >
                {loading ? 'Saving...' : 'Save Appearance'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
