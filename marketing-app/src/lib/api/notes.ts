import { supabase } from '../supabase/client'
import { Note } from '../../types/database'

type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at'>
type NoteUpdate = Partial<NoteInsert>

export const notesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Note[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Note
  },

  async create(note: NoteInsert) {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single()
    
    if (error) throw error
    return data as Note
  },

  async update(id: string, note: NoteUpdate) {
    const { data, error } = await supabase
      .from('notes')
      .update(note)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Note
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
