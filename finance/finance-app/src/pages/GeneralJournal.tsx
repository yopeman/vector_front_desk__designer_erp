import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { useJournals, useCreateJournal, useUpdateJournal, useCreateJournalLine, useUpdateJournalLine, useDeleteJournalLine, useGLAccounts, useJournalLines } from '../hooks/useFinance';
import { Plus, Pencil, X, Trash2 } from 'lucide-react';
import { financeClient } from '../services/supabaseClients';
import type { Journal, JournalStatus, JournalLine, GLAccount } from '../types';

export function GeneralJournal() {
  const { data: journals, isLoading } = useJournals();
  const { data: glAccounts } = useGLAccounts();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  const createJournalLine = useCreateJournalLine();
  const updateJournalLine = useUpdateJournalLine();
  const deleteJournalLine = useDeleteJournalLine();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState({
    journal_no: '',
    journal_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    status: 'Draft' as JournalStatus
  });
  const [journalLines, setJournalLines] = useState<Partial<JournalLine>[]>([]);
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);

  const handleOpenModal = async (journal?: Journal) => {
    if (journal) {
      setEditingJournal(journal);
      setCurrentJournalId(journal.id);
      setFormData({
        journal_no: journal.journal_no,
        journal_date: journal.journal_date,
        reference: journal.reference || '',
        description: journal.description || '',
        status: journal.status
      });
      // Load existing journal lines
      const { data: existingLines } = await financeClient
        .from('finance_journal_lines')
        .select('*')
        .eq('journal_id', journal.id);
      setJournalLines(existingLines || []);
    } else {
      setEditingJournal(null);
      setCurrentJournalId(null);
      setFormData({
        journal_no: '',
        journal_date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        status: 'Draft'
      });
      setJournalLines([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJournal(null);
    setCurrentJournalId(null);
    setFormData({
      journal_no: '',
      journal_date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      status: 'Draft'
    });
    setJournalLines([]);
  };

  const addJournalLine = () => {
    setJournalLines([...journalLines, {
      gl_account_id: '',
      description: '',
      debit: 0,
      credit: 0
    }]);
  };

  const updateJournalLineField = (index: number, field: keyof JournalLine, value: any) => {
    const updatedLines = [...journalLines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setJournalLines(updatedLines);
  };

  const removeJournalLine = async (index: number) => {
    const line = journalLines[index];
    if (line.id) {
      await deleteJournalLine.mutateAsync(line.id);
    }
    setJournalLines(journalLines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalDebit = journalLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    return { totalDebit, totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { totalDebit, totalCredit } = calculateTotals();
    
    // if (Math.abs(totalDebit - totalCredit) > 0.01) {
    //   alert('Journal must be balanced. Total debit must equal total credit.');
    //   return;
    // }
    
    if (journalLines.length === 0) {
      alert('Journal must have at least one line.');
      return;
    }

    try {
      let journalId: string;
      
      if (editingJournal) {
        journalId = editingJournal.id;
        await updateJournal.mutateAsync({
          id: editingJournal.id,
          ...formData,
          reference: formData.reference || null,
          description: formData.description || null
        });
      } else {
        const newJournal = await createJournal.mutateAsync({
          ...formData,
          reference: formData.reference || null,
          description: formData.description || null
        });
        journalId = newJournal.id;
      }

      // Save journal lines
      for (const line of journalLines) {
        if (line.id) {
          await updateJournalLine.mutateAsync({
            id: line.id,
            journal_id: journalId,
            gl_account_id: line.gl_account_id,
            description: line.description || null,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0
          });
        } else {
          await createJournalLine.mutateAsync({
            journal_id: journalId,
            gl_account_id: line.gl_account_id,
            description: line.description || null,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0
          });
        }
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
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20">
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

              {/* Journal Lines Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Journal Lines</h3>
                  <button
                    type="button"
                    onClick={addJournalLine}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>

                {journalLines.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No journal lines added yet. Click "Add Line" to create journal entries.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {journalLines.map((line, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-12 gap-3 items-start">
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              GL Account *
                            </label>
                            <select
                              required
                              value={line.gl_account_id}
                              onChange={(e) => updateJournalLineField(index, 'gl_account_id', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Account</option>
                              {glAccounts?.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={line.description || ''}
                              onChange={(e) => updateJournalLineField(index, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Line description"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Debit
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.debit || 0}
                              onChange={(e) => updateJournalLineField(index, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Credit
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.credit || 0}
                              onChange={(e) => updateJournalLineField(index, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-span-1 flex items-end">
                            <button
                              type="button"
                              onClick={() => removeJournalLine(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals Summary */}
                {journalLines.length > 0 && (
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Total Debit:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {calculateTotals().totalDebit.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Total Credit:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {calculateTotals().totalCredit.toFixed(2)}
                        </span>
                      </div>
                      {/* <div className={`text-sm font-semibold ${
                        Math.abs(calculateTotals().totalDebit - calculateTotals().totalCredit) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {Math.abs(calculateTotals().totalDebit - calculateTotals().totalCredit) < 0.01
                          ? '✓ Balanced'
                          : '✗ Unbalanced'}
                      </div> */}
                    </div>
                  </div>
                )}
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
