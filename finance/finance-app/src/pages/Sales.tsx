import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { SyncButton } from '../components/SyncButton';
import { useSales, useSalesItems } from '../hooks/useFinance';
import { useSyncSales } from '../hooks/useSync';
import type { Sale, SalesItem } from '../types';

export function Sales() {
  const { data: sales, isLoading } = useSales(1, 1000);
  const syncSales = useSyncSales();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: salesItems, isLoading: itemsLoading } = useSalesItems(
    selectedSale?.id || ''
  );

  const columns = [
    { key: 'sales_no' as keyof Sale, label: 'Sales No' },
    { key: 'sales_date' as keyof Sale, label: 'Date' },
    { key: 'customer_name' as keyof Sale, label: 'Customer' },
    { key: 'customer_tin' as keyof Sale, label: 'Customer TIN' },
    { key: 'sales_type' as keyof Sale, label: 'Type' },
    { key: 'sales_category' as keyof Sale, label: 'Category' },
    { key: 'receipt_source' as keyof Sale, label: 'Source' },
    { key: 'vat_withholding' as keyof Sale, label: 'VAT Withholding' },
    { 
      key: 'cash_received' as keyof Sale, 
      label: 'Cash Received',
      render: (value: number) => `ETB ${value?.toLocaleString() || 0}`
    },
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
      key: 'withholding_amount' as keyof Sale, 
      label: 'Withholding',
      render: (value: number) => `ETB ${value?.toLocaleString() || 0}`
    },
    { 
      key: 'total_amount' as keyof Sale, 
      label: 'Total',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'net_amount' as keyof Sale, 
      label: 'Net Amount',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { key: 'status' as keyof Sale, label: 'Status' },
    {
      key: 'actions' as keyof Sale,
      label: 'Actions',
      render: (_: any, row: Sale) => (
        <button
          onClick={() => {
            setSelectedSale(row);
            setShowModal(true);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      )
    }
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

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Sale Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSale(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Sale Header Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales No</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.sales_no}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Date</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.sales_date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer TIN</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.customer_tin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.sales_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Category</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.sales_category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt Source</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.receipt_source}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT Withholding</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.vat_withholding}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cash Received</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedSale.cash_received?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedSale.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT Amount</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedSale.vat_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Withholding Amount</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedSale.withholding_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedSale.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedSale.net_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.status}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSale.notes || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Sales Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Items</h3>
                {itemsLoading ? (
                  <p className="text-sm text-gray-500">Loading items...</p>
                ) : salesItems && salesItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesItems.map((item: SalesItem) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.item_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">ETB {item.unit_price.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.tax_rate}%</td>
                            <td className="px-4 py-2 text-sm text-gray-900">ETB {item.total?.toLocaleString() || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No items found for this sale.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
