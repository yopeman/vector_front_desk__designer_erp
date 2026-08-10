import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { useJournals, useCreateJournal, useUpdateJournal } from '../hooks/useFinance';
import { Plus, Pencil, X } from 'lucide-react';
import type { Journal, JournalStatus } from '../types';

export function GeneralJournal() {
  const { data: journals, isLoading } = useJournals();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState({
    journal_no: '',
    journal_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    status: 'Draft' as JournalStatus
  });

  const handleOpenModal = (journal?: Journal) => {
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        journal_no: journal.journal_no,
        journal_date: journal.journal_date,
        reference: journal.reference || '',
        description: journal.description || '',
        status: journal.status
      });
    } else {
      setEditingJournal(null);
      setFormData({
        journal_no: '',
        journal_date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        status: 'Draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJournal(null);
    setFormData({
      journal_no: '',
      journal_date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      status: 'Draft'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        await updateJournal.mutateAsync({
          id: editingJournal.id,
          ...formData,
          reference: formData.reference || null,
          description: formData.description || null
        });
      } else {
        await createJournal.mutateAsync({
          ...formData,
          reference: formData.reference || null,
          description: formData.description || null
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const columns = [
    { key: 'journal_no' as keyof Journal, label: 'Journal No' },
    { key: 'journal_date' as keyof Journal, label: 'Date' },
    { key: 'reference' as keyof Journal, label: 'Reference' },
    // { key: 'description' as keyof Journal, label: 'Description' },
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
    },
    {
      key: 'actions' as keyof Journal,
      label: 'Actions',
      render: (_: any, row: Journal) => (
        <button
          onClick={() => handleOpenModal(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Journal</h1>
          <p className="text-gray-600">Manage journal entries with balanced debit/credit validation</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Journal
        </button>
      </div>

      <DataTable
        data={journals || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingJournal ? 'Edit Journal' : 'Add New Journal'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journal No *
                </label>
                <input
                  type="text"
                  required
                  value={formData.journal_no}
                  onChange={(e) => setFormData({ ...formData, journal_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JNL-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journal Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.journal_date}
                  onChange={(e) => setFormData({ ...formData, journal_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., INV-123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as JournalStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Posted">Posted</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJournal.isPending || updateJournal.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {editingJournal ? 'Update' : 'Create'} Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
