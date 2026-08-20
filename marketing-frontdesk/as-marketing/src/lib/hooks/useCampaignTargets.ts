import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignTargetsApi } from '../api/campaignTargets'
import { CampaignTarget } from '../../types/database'

export function useCampaignTargets() {
  const queryClient = useQueryClient()

  const targets = useQuery({
    queryKey: ['campaign-targets'],
    queryFn: campaignTargetsApi.getAll,
  })

  const createTarget = useMutation({
    mutationFn: campaignTargetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-targets'] })
    },
  })

  const updateTarget = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignTarget> }) =>
      campaignTargetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-targets'] })
    },
  })

  const deleteTarget = useMutation({
    mutationFn: campaignTargetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-targets'] })
    },
  })

  return { targets, createTarget, updateTarget, deleteTarget }
}
