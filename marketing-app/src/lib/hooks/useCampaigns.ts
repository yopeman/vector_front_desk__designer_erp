import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsApi } from '../api/campaigns'
import { Campaign } from '../../types/database'

export function useCampaigns() {
  const queryClient = useQueryClient()

  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.getAll,
  })

  const createCampaign = useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      campaignsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: campaignsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  return {
    campaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  }
}
