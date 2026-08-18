import { supabase } from '../supabase/client'
import { ProposalItem, ProformaItem } from '../../types/database'

/** Fetches all proposal + proforma line items (used for product popularity & performance reports). */
export const lineItemsApi = {
  async getAllProposalItems() {
    const { data, error } = await supabase
      .from('proposal_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ProposalItem[]
  },

  async getAllProformaItems() {
    const { data, error } = await supabase
      .from('proforma_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ProformaItem[]
  },

  /** Fetches items joined with their parent doc status (for funnel reporting). */
  async getProposalItemsWithStatus() {
    const { data, error } = await supabase
      .from('proposal_items')
      .select('*, proposals(status)')

    if (error) throw error
    return data as (ProposalItem & { proposals: { status: string } | null })[]
  },
}
