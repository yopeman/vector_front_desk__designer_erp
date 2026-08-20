import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '../api/expenses'
import { Expense, ApprovalStatus } from '../../types/database'

export function useExpenses() {
  const queryClient = useQueryClient()

  const expenses = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  })

  const createExpense = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const updateExpense = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const deleteExpense = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const setApproval = useMutation({
    mutationFn: ({ id, status, approvedBy }: { id: string; status: ApprovalStatus; approvedBy?: string }) =>
      expensesApi.setApproval(id, status, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  return {
    expenses,
    createExpense,
    updateExpense,
    deleteExpense,
    setApproval,
  }
}
