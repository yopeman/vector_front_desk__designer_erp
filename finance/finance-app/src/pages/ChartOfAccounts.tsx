import { DataTable } from '../components/DataTable';
import { useGLAccounts } from '../hooks/useFinance';
import type { GLAccount } from '../types';

export function ChartOfAccounts() {
  const { data: accounts, isLoading } = useGLAccounts();

  const columns = [
    { key: 'account_code' as keyof GLAccount, label: 'Account Code' },
    { key: 'account_name' as keyof GLAccount, label: 'Account Name' },
    { key: 'account_type' as keyof GLAccount, label: 'Type' },
    { 
      key: 'is_active' as keyof GLAccount, 
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <p className="text-gray-600">Manage general ledger accounts</p>
      </div>

      <DataTable
        data={accounts || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}
