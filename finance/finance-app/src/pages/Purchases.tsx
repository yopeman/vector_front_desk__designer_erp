import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { SyncButton } from '../components/SyncButton';
import { usePurchases, usePurchaseItems } from '../hooks/useFinance';
import { useSyncPurchases } from '../hooks/useSync';
import type { Purchase, PurchaseItem } from '../types';

export function Purchases() {
  const { data: purchases, isLoading } = usePurchases(1, 1000);
  const syncPurchases = useSyncPurchases();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: purchaseItems, isLoading: itemsLoading } = usePurchaseItems(
    selectedPurchase?.id || ''
  );

  const columns = [
    { key: 'purchase_no' as keyof Purchase, label: 'Purchase No' },
    { key: 'purchase_date' as keyof Purchase, label: 'Date' },
    // { key: 'seller_name' as keyof Purchase, label: 'Supplier' },
    // { key: 'seller_tin' as keyof Purchase, label: 'Supplier TIN' },
    { key: 'purchase_type' as keyof Purchase, label: 'Type' },
    { key: 'receipt_source' as keyof Purchase, label: 'Source' },
    { key: 'reference_no' as keyof Purchase, label: 'Reference No' },
    { key: 'vat_type' as keyof Purchase, label: 'VAT Type' },
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
    { key: 'status' as keyof Purchase, label: 'Status' },
    { key: 'notes' as keyof Purchase, label: 'Notes' },
    {
      key: 'actions' as keyof Purchase,
      label: 'Actions',
      render: (_: any, row: Purchase) => (
        <button
          onClick={() => {
            setSelectedPurchase(row);
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

      {/* Purchase Details Modal */}
      {showModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Purchase Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPurchase(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Purchase Header Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase No</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.purchase_no}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.purchase_date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.seller_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier TIN</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.seller_tin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.purchase_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt Source</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.receipt_source}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference No</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.reference_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.vat_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedPurchase.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT Amount</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedPurchase.vat_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm text-gray-900">ETB {selectedPurchase.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.status}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPurchase.notes || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Items</h3>
                {itemsLoading ? (
                  <p className="text-sm text-gray-500">Loading items...</p>
                ) : purchaseItems && purchaseItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {purchaseItems.map((item: PurchaseItem) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.item_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.description || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">ETB {item.unit_price.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">ETB {item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No items found for this purchase.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
