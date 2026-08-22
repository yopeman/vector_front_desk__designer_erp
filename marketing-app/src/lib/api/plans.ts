import { supabase } from '../supabase/client'
import { Plan } from '../../types/database'

type PlanInsert = Omit<Plan, 'id' | 'created_at' | 'updated_at'>
type PlanUpdate = Partial<PlanInsert>

export const plansApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mrkt_plans')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Plan[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('mrkt_plans')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Plan
  },

  async create(plan: PlanInsert) {
    const { data, error } = await supabase
      .from('mrkt_plans')
      .insert(plan)
      .select()
      .single()
    
    if (error) throw error
    return data as Plan
  },

  async update(id: string, plan: PlanUpdate) {
    const { data, error } = await supabase
      .from('mrkt_plans')
      .update(plan)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Plan
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mrkt_plans')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
