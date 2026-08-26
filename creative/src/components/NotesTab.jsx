import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'

const NotesTab = ({ isActive, searchQuery }) => {
  const { user } = useCreativeAuth()
  const [notes, setNotes] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'blue'
  })

  const colors = [
    { name: 'blue', bg: 'bg-primary-100', border: 'border-blue-300', header: 'bg-primary-500' },
    { name: 'green', bg: 'bg-green-100', border: 'border-green-300', header: 'bg-green-500' },
    { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', header: 'bg-yellow-500' },
    { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', header: 'bg-pink-500' },
    { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', header: 'bg-purple-500' }
  ]

  useEffect(() => {
    if (isActive) {
      fetchNotes()
    }
  }, [isActive])

  const fetchNotes = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching notes:', error)
      } else {
        setNotes(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingNote) {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: formData.title,
          content: formData.content,
          color: formData.color
        })
        .eq('id', editingNote.id)
      
      if (error) {
        console.error('Error updating note:', error)
      } else {
        setIsModalOpen(false)
        setEditingNote(null)
        setFormData({ title: '', content: '', color: 'blue' })
        fetchNotes()
      }
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: formData.title,
          content: formData.content,
          color: formData.color,
          user_id: user.id
        }])
      
      if (error) {
        console.error('Error adding note:', error)
      } else {
        setIsModalOpen(false)
        setFormData({ title: '', content: '', color: 'blue' })
        fetchNotes()
      }
    }
  }

  const handleEditNote = (note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      color: note.color
    })
    setIsModalOpen(true)
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
    
    if (error) {
      console.error('Error deleting note:', error)
    } else {
      fetchNotes()
    }
  }

  const handleOpenModal = () => {
    setEditingNote(null)
    setFormData({ title: '', content: '', color: 'blue' })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNote(null)
    setFormData({ title: '', content: '', color: 'blue' })
  }

  const filteredNotes = notes.filter(note => 
    !searchQuery || Object.values(note).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const getColorClasses = (colorName) => {
    const color = colors.find(c => c.name === colorName) || colors[0]
    return {
      bg: color.bg,
      border: color.border,
      header: color.header
    }
  }

  if (!isActive) return <div className="hidden"></div>

  return (
    <div className={`tab-content ${isActive ? 'active' : ''} space-y-4`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Notes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quick notes and reminders</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition"
          >
            <i className="fa-solid fa-plus mr-1"></i> New Note
          </button>
        </div>
        <div className="p-5">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">No notes yet. Create your first note!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => {
                const colorClasses = getColorClasses(note.color)
                return (
                  <div key={note.id} className={`${colorClasses.bg} ${colorClasses.border} border-2 rounded-xl p-4 hover:shadow-md transition min-h-[200px] flex flex-col`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`${colorClasses.header} text-white text-xs font-bold px-2 py-1 rounded inline-block`}>
                        {note.title}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen text-xs text-slate-600"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash text-xs text-red-500"></i>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 flex-1 whitespace-pre-wrap overflow-y-auto max-h-[150px]">{note.content}</p>
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-300">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white w-11/12 max-w-lg mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-sticky-note text-primary-500 mr-2"></i>
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Note title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Note content..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color</label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormData({...formData, color: color.name})}
                      className={`w-8 h-8 rounded-full ${color.header} ${formData.color === color.name ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotesTab