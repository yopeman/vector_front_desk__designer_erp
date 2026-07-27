import { useAuth } from '../lib/auth';

export default function PendingPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-lg text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-clock text-yellow-600 text-2xl"></i>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Account Pending Approval</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your account is currently pending approval from an administrator.
          You will be notified once your role has been assigned.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
          <p className="text-gray-600">
            <span className="font-semibold">Username:</span> {profile?.username || '-'}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">Email:</span> {profile?.email || '-'}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">Status:</span>{' '}
            <span className="text-yellow-600 font-semibold">Pending</span>
          </p>
        </div>
        <button
          onClick={signOut}
          className="w-full py-2.5 bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-300 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}