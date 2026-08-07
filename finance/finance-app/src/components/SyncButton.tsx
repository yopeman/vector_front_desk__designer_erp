import { Loader2 } from 'lucide-react';

interface SyncButtonProps {
  onSync: () => Promise<any>;
  isSyncing: boolean;
  label: string;
  disabled?: boolean;
}

export function SyncButton({ onSync, isSyncing, label, disabled = false }: SyncButtonProps) {
  return (
    <button
      onClick={onSync}
      disabled={isSyncing || disabled}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Syncing...
        </>
      ) : (
        label
      )}
    </button>
  );
}
