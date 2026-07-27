import { useAuth } from '../../../lib/auth';

export default function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Front Desk Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Welcome, {profile?.username || 'Officer'}
        </p>
      </div>
      <button
        onClick={signOut}
        className="text-sm text-red-600 hover:text-red-800 font-medium"
      >
        Sign Out
      </button>
    </header>
  );
}