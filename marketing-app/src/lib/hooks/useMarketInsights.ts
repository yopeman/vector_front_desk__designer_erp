import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketInsightsApi } from '../api/marketInsights'
import { MarketInsight } from '../../types/database'

export function useMarketInsights() {
  const queryClient = useQueryClient()

  const insights = useQuery({
    queryKey: ['market-insights'],
    queryFn: marketInsightsApi.getAll,
  })

  const createInsight = useMutation({
    mutationFn: marketInsightsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-insights'] })
    },
  })

  const updateInsight = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketInsight> }) =>
      marketInsightsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-insights'] })
    },
  })

  const deleteInsight = useMutation({
    mutationFn: marketInsightsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-insights'] })
    },
  })

  return { insights, createInsight, updateInsight, deleteInsight }
}
