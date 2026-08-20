import { supabase } from '../supabase/client'
import { Expense, ApprovalStatus } from '../../types/database'

type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>
type ExpenseUpdate = Partial<ExpenseInsert>

export const expensesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (error) throw error
    return data as Expense[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Expense
  },

  async create(expense: ExpenseInsert) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  async update(id: string, expense: ExpenseUpdate) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async setApproval(id: string, approval_status: ApprovalStatus, approved_by?: string) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ approval_status, approved_by: approved_by ?? null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },
}
