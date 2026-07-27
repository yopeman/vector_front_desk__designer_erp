import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        // Redirect is handled by the RoleRouter in App.jsx
        navigate('/');
      } else {
        // Signup
        await signUp(email, password, username);
        setSuccessMsg(
          'Account created successfully! An administrator will assign your role. You can sign in once approved.'
        );
        setMode('login');
        setUsername('');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccessMsg('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1b2e] via-[#1a2f4e] to-[#0d1b2e]">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-2 h-7 bg-gradient-to-b from-blue-600 to-purple-600 rounded-sm" />
            <span className="text-2xl font-extrabold tracking-wider text-[#0d1b2e]">
              VECTOR
            </span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            Advert & Manufacturing ERP
          </p>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create Account'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {mode === 'login'
            ? 'Sign in to your account to continue'
            : 'Register to get access after admin approval'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="text-center mt-6 text-[11px] text-gray-300">
          Internal use only &mdash; Vector ERP System
        </p>
      </div>
    </div>
  );
}