import { supabase } from '../supabase/client'
import { Proposal } from '../../types/database'

type ProposalInsert = Omit<Proposal, 'id' | 'created_at' | 'updated_at'>
type ProposalUpdate = Partial<ProposalInsert>

export const proposalsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mrkt_proposals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Proposal[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('mrkt_proposals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Proposal
  },

  async create(proposal: ProposalInsert) {
    const { data, error } = await supabase
      .from('mrkt_proposals')
      .insert(proposal)
      .select()
      .single()
    
    if (error) throw error
    return data as Proposal
  },

  async update(id: string, proposal: ProposalUpdate) {
    const { data, error } = await supabase
      .from('mrkt_proposals')
      .update(proposal)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Proposal
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mrkt_proposals')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
