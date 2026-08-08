import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeClient } from '../services/supabaseClients';
import type { GLAccount, Purchase, PurchaseItem, Sale, SalesItem, Journal, JournalLine, Payroll } from '../types';

// GL Accounts Hooks
export function useGLAccounts() {
  return useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_gl_accounts')
        .select('*')
        .order('account_code');
      
      if (error) throw error;
      return data as GLAccount[];
    }
  });
}

export function useGLAccount(id: string) {
  return useQuery({
    queryKey: ['gl-account', id],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_gl_accounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as GLAccount;
    },
    enabled: !!id
  });
}

export function useCreateGLAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: Partial<GLAccount>) => {
      const { data, error } = await financeClient
        .from('finance_gl_accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) throw error;
      return data as GLAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-accounts'] });
    }
  });
}

export function useUpdateGLAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...account }: Partial<GLAccount> & { id: string }) => {
      const { data, error } = await financeClient
        .from('finance_gl_accounts')
        .update(account)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as GLAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-accounts'] });
    }
  });
}

export function useDeleteGLAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await financeClient
        .from('gl_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-accounts'] });
    }
  });
}

// Purchases Hooks
export function usePurchases(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['purchases', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await financeClient
        .from('finance_purchases')
        .select('*')
        .order('purchase_date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data as Purchase[];
    }
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_purchases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Purchase;
    },
    enabled: !!id
  });
}

export function usePurchaseItems(purchaseId: string) {
  return useQuery({
    queryKey: ['purchase-items', purchaseId],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_purchase_items')
        .select('*')
        .eq('purchase_id', purchaseId);
      
      if (error) throw error;
      return data as PurchaseItem[];
    },
    enabled: !!purchaseId
  });
}

// Sales Hooks
export function useSales(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['sales', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await financeClient
        .from('finance_sales')
        .select('*')
        .order('sales_date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data as Sale[];
    }
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_sales')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Sale;
    },
    enabled: !!id
  });
}

export function useSalesItems(salesId: string) {
  return useQuery({
    queryKey: ['sales-items', salesId],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_sales_items')
        .select('*')
        .eq('sales_id', salesId);
      
      if (error) throw error;
      return data as SalesItem[];
    },
    enabled: !!salesId
  });
}

// Journals Hooks
export function useJournals(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['journals', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await financeClient
        .from('finance_journals')
        .select('*')
        .order('journal_date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data as Journal[];
    }
  });
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: ['journal', id],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_journals')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Journal;
    },
    enabled: !!id
  });
}

export function useJournalLines(journalId: string) {
  return useQuery({
    queryKey: ['journal-lines', journalId],
    queryFn: async () => {
      const { data, error } = await financeClient
        .from('finance_journal_lines')
        .select('*')
        .eq('journal_id', journalId);
      
      if (error) throw error;
      return data as JournalLine[];
    },
    enabled: !!journalId
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (journal: Partial<Journal>) => {
      const { data, error } = await financeClient
        .from('finance_journals')
        .insert(journal)
        .select()
        .single();
      
      if (error) throw error;
      return data as Journal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    }
  });
}

// Payroll Hooks
export function usePayroll(year?: number, month?: number) {
  return useQuery({
    queryKey: ['payroll', year, month],
    queryFn: async () => {
      let query = financeClient.from('finance_payroll').select('*');
      
      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        // Use overlap check: payroll period overlaps with selected month
        query = query.lte('period_start', endDate).gte('period_end', startDate);
      }
      
      const { data, error } = await query.order('period_start', { ascending: false });
      
      if (error) throw error;
      return data as Payroll[];
    }
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payroll: Partial<Payroll>) => {
      const { data, error } = await financeClient
        .from('finance_payroll')
        .insert(payroll)
        .select()
        .single();
      
      if (error) throw error;
      return data as Payroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    }
  });
}

export function useUpdatePayrollStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'Draft' | 'Approved' | 'Paid' }) => {
      const { data, error } = await financeClient
        .from('finance_payroll')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Payroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    }
  });
}
