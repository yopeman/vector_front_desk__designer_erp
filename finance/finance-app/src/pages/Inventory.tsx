import { DataTable } from '../components/DataTable';
import { storeClient } from '../services/supabaseClients';
import { useQuery } from '@tanstack/react-query';

interface StockItem {
  id: string;
  code: string;
  name: string;
  category: string;
  balance: number;
  unit_cost: number;
  reorder_level: number;
}

export function Inventory() {
  const { data: stockItems, isLoading } = useQuery({
    queryKey: ['stock-items'],
    queryFn: async () => {
      const { data, error } = await storeClient
        .from('stock_items')
        .select('*')
        .order('category');
      
      if (error) throw error;
      return data as StockItem[];
    }
  });

  const columns = [
    { key: 'code' as keyof StockItem, label: 'Item Code' },
    { key: 'name' as keyof StockItem, label: 'Item Name' },
    { key: 'category' as keyof StockItem, label: 'Category' },
    { 
      key: 'balance' as keyof StockItem, 
      label: 'Balance',
      render: (value: number, row: StockItem) => (
        <span className={value <= row.reorder_level ? 'text-red-600 font-semibold' : ''}>
          {value}
        </span>
      )
    },
    { 
      key: 'unit_cost' as keyof StockItem, 
      label: 'Unit Cost',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'reorder_level' as keyof StockItem, 
      label: 'Reorder Level'
    },
    {
      key: 'balance' as keyof StockItem,
      label: 'Status',
      render: (value: number, row: StockItem) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value <= row.reorder_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value <= row.reorder_level ? 'Low Stock' : 'In Stock'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">View stock items from Store module (read-only)</p>
      </div>

      <DataTable
        data={stockItems || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}
