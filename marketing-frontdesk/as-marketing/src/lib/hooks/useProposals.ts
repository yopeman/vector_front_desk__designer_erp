import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proposalsApi } from '../api/proposals'
import { Proposal } from '../../types/database'

export function useProposals() {
  const queryClient = useQueryClient()

  const proposals = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalsApi.getAll,
  })

  const createProposal = useMutation({
    mutationFn: proposalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })

  const updateProposal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proposal> }) =>
      proposalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })

  const deleteProposal = useMutation({
    mutationFn: proposalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })

  return {
    proposals,
    createProposal,
    updateProposal,
    deleteProposal,
  }
}
