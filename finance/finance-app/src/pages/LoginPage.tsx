import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password, username);
        setSuccessMsg(
          'Account created successfully! An administrator will assign your role. You can sign in once approved.'
        );
        setMode('login');
        setUsername('');
      }
    } catch (err: any) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00ced1] via-[#00b8bb] to-[#00ced1]">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ced1] to-[#00b8bb]" />

        <div className="text-center mb-8 bg-[#00ced1] rounded-xl py-5 px-4">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl font-extrabold tracking-wider text-white uppercase">
              V☰CTOR
            </span>
          </div>
          <p className="text-[10px] text-white uppercase tracking-widest">
            Finance ERP
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
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#e6fffd] transition"
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
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#e6fffd] transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#00ced1] to-[#00b8bb] text-white font-bold text-sm rounded-lg hover:opacity-90 transition disabled:opacity-60"
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
            className="text-sm text-[#00ced1] hover:underline font-medium cursor-pointer bg-transparent border-none"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="text-center mt-6 text-[11px] text-gray-300">
          Internal use only &mdash; V☰CTOR Finance ERP System
        </p>
      </div>
    </div>
  );
}
