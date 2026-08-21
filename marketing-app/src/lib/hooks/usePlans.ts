import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plansApi } from '../api/plans'
import { Plan } from '../../types/database'

export function usePlans() {
  const queryClient = useQueryClient()

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.getAll,
  })

  const createPlan = useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) =>
      plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const deletePlan = useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  return {
    plans,
    createPlan,
    updatePlan,
    deletePlan,
  }
}
