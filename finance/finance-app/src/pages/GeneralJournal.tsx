import { DataTable } from '../components/DataTable';
import { useJournals } from '../hooks/useFinance';
import type { Journal } from '../types';

export function GeneralJournal() {
  const { data: journals, isLoading } = useJournals();

  const columns = [
    { key: 'journal_no' as keyof Journal, label: 'Journal No' },
    { key: 'journal_date' as keyof Journal, label: 'Date' },
    { key: 'reference' as keyof Journal, label: 'Reference' },
    { key: 'description' as keyof Journal, label: 'Description' },
    { 
      key: 'status' as keyof Journal, 
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Posted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Journal</h1>
        <p className="text-gray-600">Manage journal entries with balanced debit/credit validation</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Journal entry form with balanced debit/credit validation will be implemented in the next phase.
          Currently viewing existing journal entries.
        </p>
      </div>

      <DataTable
        data={journals || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}
