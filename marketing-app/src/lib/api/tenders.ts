import { supabase } from '../supabase/client'
import { Tender } from '../../types/database'

type TenderInsert = Omit<Tender, 'id' | 'created_at' | 'updated_at'>
type TenderUpdate = Partial<TenderInsert>

export const tendersApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mrkt_tenders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Tender[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('mrkt_tenders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Tender
  },

  async create(tender: TenderInsert) {
    const { data, error } = await supabase
      .from('mrkt_tenders')
      .insert(tender)
      .select()
      .single()
    
    if (error) throw error
    return data as Tender
  },

  async update(id: string, tender: TenderUpdate) {
    const { data, error } = await supabase
      .from('mrkt_tenders')
      .update(tender)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Tender
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mrkt_tenders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
