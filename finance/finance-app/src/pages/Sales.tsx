import { DataTable } from '../components/DataTable';
import { SyncButton } from '../components/SyncButton';
import { useSales } from '../hooks/useFinance';
import { useSyncSales } from '../hooks/useSync';
import type { Sale } from '../types';

export function Sales() {
  const { data: sales, isLoading } = useSales();
  const syncSales = useSyncSales();

  const columns = [
    { key: 'sales_no' as keyof Sale, label: 'Sales No' },
    { key: 'sales_date' as keyof Sale, label: 'Date' },
    { key: 'customer_name' as keyof Sale, label: 'Customer' },
    { key: 'sales_type' as keyof Sale, label: 'Type' },
    { 
      key: 'subtotal' as keyof Sale, 
      label: 'Subtotal',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'vat_amount' as keyof Sale, 
      label: 'VAT',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'total_amount' as keyof Sale, 
      label: 'Total',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { key: 'status' as keyof Sale, label: 'Status' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Manage sales records from Frontdesk module</p>
        </div>
        <SyncButton
          onSync={() => syncSales.mutateAsync()}
          isSyncing={syncSales.isPending}
          label="Sync from Frontdesk"
        />
      </div>

      <DataTable
        data={sales || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}
