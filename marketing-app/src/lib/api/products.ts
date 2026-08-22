import { supabase } from '../supabase/client'
import { ProductService } from '../../types/database'

type ProductInsert = Omit<ProductService, 'id' | 'created_at' | 'updated_at'>
type ProductUpdate = Partial<ProductInsert>

export const productsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mrkt_products_services')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data as ProductService[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('mrkt_products_services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ProductService
  },

  async create(product: ProductInsert) {
    const { data, error } = await supabase
      .from('mrkt_products_services')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data as ProductService
  },

  async update(id: string, product: ProductUpdate) {
    const { data, error } = await supabase
      .from('mrkt_products_services')
      .update(product)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ProductService
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mrkt_products_services')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
