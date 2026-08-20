import { supabase } from '../supabase/client'
import { Proforma, ProformaItem, Proposal } from '../../types/database'

type ProformaInsert = Omit<Proforma, 'id' | 'created_at' | 'updated_at'>
type ProformaUpdate = Partial<ProformaInsert>
type ProformaItemInsert = Omit<ProformaItem, 'id' | 'created_at' | 'total'>
type ProformaItemUpdate = Partial<ProformaItemInsert>

export const proformasApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('proformas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Proforma[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('proformas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Proforma
  },

  async create(proforma: ProformaInsert) {
    const { data, error } = await supabase
      .from('proformas')
      .insert(proforma)
      .select()
      .single()

    if (error) throw error
    return data as Proforma
  },

  async update(id: string, proforma: ProformaUpdate) {
    const { data, error } = await supabase
      .from('proformas')
      .update(proforma)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Proforma
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('proformas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ---- Line items ----
  async getItems(proformaId: string) {
    const { data, error } = await supabase
      .from('proforma_items')
      .select('*')
      .eq('proforma_id', proformaId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as ProformaItem[]
  },

  async addItem(item: ProformaItemInsert) {
    const { data, error } = await supabase
      .from('proforma_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return data as ProformaItem
  },

  async updateItem(id: string, item: ProformaItemUpdate) {
    const { data, error } = await supabase
      .from('proforma_items')
      .update(item)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ProformaItem
  },

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('proforma_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ---- Conversion to proposal ----
  async convertToProposal(proformaId: string): Promise<{
    proforma: Proforma
    proposal: Proposal
    itemsCopied: number
  }> {
    const { data: proforma, error: pErr } = await supabase
      .from('proformas')
      .select('*')
      .eq('id', proformaId)
      .single()
    if (pErr) throw pErr

    const { data: items, error: iErr } = await supabase
      .from('proforma_items')
      .select('*')
      .eq('proforma_id', proformaId)
    if (iErr) throw iErr

    const { data: proposal, error: cErr } = await supabase
      .from('proposals')
      .insert({
        campaign_id: proforma.campaign_id,
        client_name: proforma.client_name,
        client_email: proforma.client_email,
        amount: proforma.amount,
        status: 'draft',
        owner_id: proforma.owner_id,
        file_url: proforma.file_url,
        notes: proforma.notes,
      })
      .select()
      .single()
    if (cErr) throw cErr

    let itemsCopied = 0
    if (items && items.length > 0) {
      const mapped = items.map((it) => ({
        proposal_id: proposal.id,
        product_service_id: it.product_service_id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
      }))
      const { error: itemErr } = await supabase
        .from('proposal_items')
        .insert(mapped)
      if (itemErr) throw itemErr
      itemsCopied = mapped.length
    }

    return { proforma: proforma as Proforma, proposal: proposal as Proposal, itemsCopied }
  },
}
