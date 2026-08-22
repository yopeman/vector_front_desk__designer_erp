import { supabase } from '../supabase/client'
import { MarketInsight } from '../../types/database'

type MarketInsightInsert = Omit<MarketInsight, 'id' | 'created_at' | 'updated_at'>
type MarketInsightUpdate = Partial<MarketInsightInsert>

export const marketInsightsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mrkt_market_insights')
      .select('*')
      .order('date_identified', { ascending: false })

    if (error) throw error
    return data as MarketInsight[]
  },

  async create(insight: MarketInsightInsert) {
    const { data, error } = await supabase
      .from('mrkt_market_insights')
      .insert(insight)
      .select()
      .single()

    if (error) throw error
    return data as MarketInsight
  },

  async update(id: string, insight: MarketInsightUpdate) {
    const { data, error } = await supabase
      .from('mrkt_market_insights')
      .update(insight)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as MarketInsight
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mrkt_market_insights')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
