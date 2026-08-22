import { supabase } from '../supabase/client'
import { Activity } from '../../types/database'

type ActivityInsert = Omit<Activity, 'id' | 'created_at' | 'updated_at'>
type ActivityUpdate = Partial<ActivityInsert>

export const activitiesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mrkt_activities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Activity[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('mrkt_activities')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Activity
  },

  async create(activity: ActivityInsert) {
    const { data, error } = await supabase
      .from('mrkt_activities')
      .insert(activity)
      .select()
      .single()
    
    if (error) throw error
    return data as Activity
  },

  async update(id: string, activity: ActivityUpdate) {
    const { data, error } = await supabase
      .from('mrkt_activities')
      .update(activity)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Activity
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mrkt_activities')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
