import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#fff9c4',
    pinned: false,
    entity_type: '',
    entity_id: '',
    checklist: [],
  });
  const [newCheckItem, setNewCheckItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUserId)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const submitData = {
        user_id: currentUserId,
        title: formData.title,
        content: formData.content,
        color: formData.color,
        pinned: formData.pinned,
        entity_type: formData.entity_type || null,
        entity_id: formData.entity_id || null,
        checklist: formData.checklist,
      };

      if (editingId) {
        const { error } = await supabase
          .from('notes')
          .update(submitData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([submitData]);
        if (error) throw error;
      }

      resetForm();
      await fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note: ' + error.message);
    }
  };

  const handleEdit = (note) => {
    setFormData({
      title: note.title || '',
      content: note.content || '',
      color: note.color || '#fff9c4',
      pinned: note.pinned || false,
      entity_type: note.entity_type || '',
      entity_id: note.entity_id || '',
      checklist: note.checklist || [],
    });
    setEditingId(note.id);
    setShowModal(true);
  };


  const togglePin = async (note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ pinned: !note.pinned })
        .eq('id', note.id);
      if (error) throw error;
      await fetchNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setFormData((prev) => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        { text: newCheckItem.trim(), done: false, id: crypto.randomUUID() },
      ],
    }));
    setNewCheckItem('');
  };

  const toggleCheckItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const removeCheckItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== itemId),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      color: '#fff9c4',
      pinned: false,
      entity_type: '',
      entity_id: '',
      checklist: [],
    });
    setEditingId(null);
    setShowModal(false);
    setNewCheckItem('');
  };

  const COLORS = ['#fff9c4', '#c8e6c9', '#bbdefb', '#f8bbd0', '#d1c4e9', '#ffe0b2', '#b2dfdb', '#cfd8dc'];

  const filteredNotes = notes.filter((note) => {
    if (filter === 'pinned') return note.pinned;
    if (filter === 'unpinned') return !note.pinned;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Notes</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Note
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
              filter === 'pinned'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-thumbtack mr-1"></i>Pinned
          </button>
          <button
            onClick={() => setFilter('unpinned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
              filter === 'unpinned'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Unpinned
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <i className="fa-solid fa-note-sticky text-4xl text-slate-300 mb-4"></i>
          <p className="text-sm font-medium text-slate-500">No notes found</p>
          <p className="text-xs text-slate-400 mt-1">Create a new note to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              style={{ backgroundColor: note.color || '#fff9c4' }}
              className="rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm text-slate-800 truncate flex-1 mr-2">
                  {note.title || 'Untitled'}
                </h3>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                    className={`text-xs bg-transparent border-none cursor-pointer p-1 ${note.pinned ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'}`}
                    title={note.pinned ? 'Unpin' : 'Pin'}
                  >
                    <i className="fa-solid fa-thumbtack"></i>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(note); }}
                    className="text-xs text-slate-400 hover:text-blue-600 bg-transparent border-none cursor-pointer p-1"
                    title="Edit"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                </div>
              </div>

              {note.content && (
                <p className="text-xs text-slate-600 mb-3 whitespace-pre-wrap" style={{ maxHeight: '60px', overflow: 'hidden' }}>
                  {note.content}
                </p>
              )}

              {note.checklist && note.checklist.length > 0 && (
                <div className="space-y-1 mb-3">
                  {note.checklist.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={item.done || false}
                        onChange={() => {}}
                        className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        readOnly
                      />
                      <span className={`${item.done ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                  {note.checklist.length > 5 && (
                    <span className="text-xs text-slate-400">+{note.checklist.length - 5} more</span>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                {note.entity_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-slate-500">
                    {note.entity_type}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto">
                  {new Date(note.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-20"
          onClick={() => { resetForm(); }}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Note' : 'New Note'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-lg"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="10"
                  placeholder="Write your note here..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                          formData.color === c ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Entity Type</label>
                  <input
                    type="text"
                    value={formData.entity_type}
                    onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                    placeholder="e.g. client, order, design"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Pinned</span>
                </label>
              </div>

              {/* Checklist */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Checklist</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    placeholder="Add checklist item"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addCheckItem(); }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCheckItem}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border border-slate-300"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.done || false}
                        onChange={() => toggleCheckItem(item.id)}
                        className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={`text-xs flex-1 ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCheckItem(item.id)}
                        className="text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer border-none"
                >
                  <i className="fa-solid fa-floppy-disk mr-2"></i>Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}