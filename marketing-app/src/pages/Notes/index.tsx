import { useState } from 'react'
import { useNotes } from '../../lib/hooks/useNotes'
import { Note, ChecklistItem } from '../../types/database'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Plus, Trash2, Pin, PinOff, Check, X } from 'lucide-react'

const NOTE_COLORS = [
  '#ffffff',
  '#fef3c7',
  '#d1fae5',
  '#dbeafe',
  '#fce7f3',
  '#e0e7ff',
  '#fef9c3',
  '#f3e8ff',
]

export default function NotesPage() {
  const { notes, createNote, updateNote, deleteNote } = useNotes()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | undefined>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('#ffffff')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

  const handleCreate = () => {
    setEditingNote(undefined)
    setTitle('')
    setContent('')
    setColor('#ffffff')
    setChecklist([])
    setIsFormOpen(true)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setTitle(note.title || '')
    setContent(note.content || '')
    setColor(note.color)
    setChecklist(note.checklist || [])
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote.mutateAsync(id)
    }
  }

  const handleTogglePin = async (note: Note) => {
    await updateNote.mutateAsync({ id: note.id, data: { pinned: !note.pinned } })
  }

  const handleSubmit = async () => {
    if (!title.trim()) return

    const noteData = {
      title,
      content,
      color,
      pinned: editingNote?.pinned || false,
      checklist,
    }

    if (editingNote) {
      await updateNote.mutateAsync({ id: editingNote.id, data: noteData })
    } else {
      await createNote.mutateAsync(noteData as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingNote(undefined)
  }

  const addChecklistItem = () => {
    setChecklist([...checklist, { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, text: '', completed: false }])
  }

  const updateChecklistItem = (id: string, text: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text } : item))
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item))
  }

  const deleteChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id))
  }

  if (notes.isLoading) {
    return <div className="text-center py-12">Loading notes...</div>
  }

  if (notes.error) {
    return <div className="text-center py-12 text-red-600">Error loading notes</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600 mt-2">Manage your notes and checklists</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes.data?.map((note) => (
          <Card
            key={note.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: note.color }}
            onClick={() => handleEdit(note)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {note.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTogglePin(note)
                  }}
                >
                  {note.pinned ? (
                    <Pin className="w-4 h-4 text-primary" fill="currentColor" />
                  ) : (
                    <PinOff className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {note.content && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{note.content}</p>
              )}
              {note.checklist && note.checklist.length > 0 && (
                <div className="space-y-1">
                  {note.checklist.slice(0, 3).map((item, index) => (
                    <div key={item.id || index} className="flex items-center gap-2 text-sm">
                      {item.completed ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                      )}
                      <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                  {note.checklist.length > 3 && (
                    <p className="text-xs text-gray-500">+{note.checklist.length - 3} more items</p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
                <span className="text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(note.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.data?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No notes yet. Create your first note!</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editingNote ? 'Edit Note' : 'Create Note'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Note content"
                style={{ backgroundColor: 'white' }}
                className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === c ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Checklists</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={item.id || index} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        item.completed ? 'bg-green-600 border-green-600' : 'border-gray-300'
                      }`}
                    >
                      {item.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <Input
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                      placeholder="Checklist item"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChecklistItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                className="text-white"
                onClick={handleSubmit}
                disabled={!title?.trim() || createNote.isPending || updateNote.isPending}
              >
                {editingNote ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
