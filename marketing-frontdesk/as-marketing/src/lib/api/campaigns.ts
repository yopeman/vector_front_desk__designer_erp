import { supabase } from '../supabase/client'
import { Campaign } from '../../types/database'

type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
type CampaignUpdate = Partial<CampaignInsert>

export const campaignsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Campaign[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Campaign
  },

  async create(campaign: CampaignInsert) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single()
    
    if (error) throw error
    return data as Campaign
  },

  async update(id: string, campaign: CampaignUpdate) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(campaign)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Campaign
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
