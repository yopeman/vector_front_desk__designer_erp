import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ItemsPage() {
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    pcs: 0,
    kilo: 0,
    care: 0,
    liter: 0,
    meter: 0,
    pack: 0,
    gram: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        pcs: formData.pcs || 0,
        kilo: formData.kilo || 0,
        care: formData.care || 0,
        liter: formData.liter || 0,
        meter: formData.meter || 0,
        pack: formData.pack || 0,
        gram: formData.gram || 0
      };

      if (editingId) {
        const { error } = await supabase
          .from('items')
          .update(submitData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .insert([submitData]);
        if (error) throw error;
      }

      await fetchItems();
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '',
      pcs: item.pcs || 0,
      kilo: item.kilo || 0,
      care: item.care || 0,
      liter: item.liter || 0,
      meter: item.meter || 0,
      pack: item.pack || 0,
      gram: item.gram || 0
    });
    setEditingId(item.id);
    setShowModal(true);
  };


  const resetForm = () => {
    setFormData({
      name: '',
      pcs: 0,
      kilo: 0,
      care: 0,
      liter: 0,
      meter: 0,
      pack: 0,
      gram: 0
    });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      (item.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Items</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Item
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Name</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Pcs</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Kilo</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Care</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Liter</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Meter</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Pack</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Gram</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-8 text-center text-slate-400">
                  No items found
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{item.name || '-'}</td>
                  <td className="p-4">{item.pcs || 0}</td>
                  <td className="p-4">{item.kilo || 0}</td>
                  <td className="p-4">{item.care || 0}</td>
                  <td className="p-4">{item.liter || 0}</td>
                  <td className="p-4">{item.meter || 0}</td>
                  <td className="p-4">{item.pack || 0}</td>
                  <td className="p-4">{item.gram || 0}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Item' : 'New Item'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Pcs</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pcs}
                      onChange={(e) => setFormData({ ...formData, pcs: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Kilo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.kilo}
                      onChange={(e) => setFormData({ ...formData, kilo: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Care</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.care}
                      onChange={(e) => setFormData({ ...formData, care: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Liter</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.liter}
                      onChange={(e) => setFormData({ ...formData, liter: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Meter</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.meter}
                      onChange={(e) => setFormData({ ...formData, meter: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Pack</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pack}
                      onChange={(e) => setFormData({ ...formData, pack: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Gram</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gram}
                      onChange={(e) => setFormData({ ...formData, gram: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-colors border-none cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
