import { supabase } from '../supabase/client'
import { CampaignTarget } from '../../types/database'

type CampaignTargetInsert = Omit<CampaignTarget, 'id' | 'created_at' | 'updated_at'>
type CampaignTargetUpdate = Partial<CampaignTargetInsert>

export const campaignTargetsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('campaign_targets')
      .select('*')
      .order('target_date', { ascending: false })

    if (error) throw error
    return data as CampaignTarget[]
  },

  async getByCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_targets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('target_date', { ascending: false })

    if (error) throw error
    return data as CampaignTarget[]
  },

  async create(target: CampaignTargetInsert) {
    const { data, error } = await supabase
      .from('campaign_targets')
      .insert(target)
      .select()
      .single()

    if (error) throw error
    return data as CampaignTarget
  },

  async update(id: string, target: CampaignTargetUpdate) {
    const { data, error } = await supabase
      .from('campaign_targets')
      .update(target)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as CampaignTarget
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('campaign_targets')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
