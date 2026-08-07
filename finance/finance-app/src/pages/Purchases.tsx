import { DataTable } from '../components/DataTable';
import { SyncButton } from '../components/SyncButton';
import { usePurchases } from '../hooks/useFinance';
import { useSyncPurchases } from '../hooks/useSync';
import type { Purchase } from '../types';

export function Purchases() {
  const { data: purchases, isLoading } = usePurchases();
  const syncPurchases = useSyncPurchases();

  const columns = [
    { key: 'purchase_no' as keyof Purchase, label: 'Purchase No' },
    { key: 'purchase_date' as keyof Purchase, label: 'Date' },
    { key: 'seller_name' as keyof Purchase, label: 'Supplier' },
    { key: 'purchase_type' as keyof Purchase, label: 'Type' },
    { 
      key: 'subtotal' as keyof Purchase, 
      label: 'Subtotal',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'vat_amount' as keyof Purchase, 
      label: 'VAT',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'total_amount' as keyof Purchase, 
      label: 'Total',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { key: 'status' as keyof Purchase, label: 'Status' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600">Manage purchase records from Store module</p>
        </div>
        <SyncButton
          onSync={() => syncPurchases.mutateAsync()}
          isSyncing={syncPurchases.isPending}
          label="Sync from Store"
        />
      </div>

      <DataTable
        data={purchases || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}
