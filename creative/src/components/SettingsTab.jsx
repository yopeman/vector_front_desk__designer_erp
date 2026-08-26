import React, { useState, useEffect } from 'react';
import { useCreativeAuth } from '../contexts/CreativeAuthContext';
import { supabase } from '../lib/supabaseClient';

const SettingsTab = ({ isActive }) => {
  const { user } = useCreativeAuth();
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    department: '',
    position: '',
  });

  // Load profile data when user changes or tab becomes active
  useEffect(() => {
    if (user && isActive) {
      loadProfileData();
    }
  }, [user, isActive]);

  const loadProfileData = async () => {
    try {
      // First try to get from user metadata
      const metadata = user?.user_metadata || {};
      
      // Also try to fetch from creative_users table if it exists
      let dbData = {};
      try {
        const { data, error } = await supabase
          .from('creative_users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          dbData = data;
        }
      } catch (err) {
        // Table might not exist, just use metadata
      }

      setProfileForm({
        email: user?.email || '',
        full_name: metadata.full_name || dbData.full_name || user?.email?.split('@')[0] || '',
        phone: metadata.phone || dbData.phone || '',
        department: metadata.department || dbData.department || '',
        position: metadata.position || dbData.position || '',
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          department: profileForm.department,
          position: profileForm.position,
        },
      });

      if (error) throw error;

      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      showMessage('error', 'All password fields are required');
      setLoading(false);
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showMessage('error', 'New password and confirm password do not match');
      setLoading(false);
      return;
    }

    if (securityForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: securityForm.currentPassword,
      });

      if (signInError) {
        showMessage('error', 'Current password is incorrect');
        setLoading(false);
        return;
      }

      // Current password is correct, now update to new password
      const { error } = await supabase.auth.updateUser({
        password: securityForm.newPassword,
      });

      if (error) throw error;

      showMessage('success', 'Password updated successfully!');
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-600">Manage your account settings and preferences</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-6 py-3 font-medium transition ${
            activeSubTab === 'profile'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-6 py-3 font-medium transition ${
            activeSubTab === 'security'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Security
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            {message.text}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">Update Profile</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="Enter your phone number"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="Enter your department"
                />
              </div> */}
              {/* <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={profileForm.position}
                  onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="Enter your position"
                />
              </div> */}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">Update Password</h3>
          <form onSubmit={handleSecuritySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={securityForm.newPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                placeholder="Enter your new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={securityForm.confirmPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                placeholder="Confirm your new password"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
