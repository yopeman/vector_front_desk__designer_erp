import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proformasApi } from '../api/proformas'
import { Proforma } from '../../types/database'

export function useProformas() {
  const queryClient = useQueryClient()

  const proformas = useQuery({
    queryKey: ['proformas'],
    queryFn: proformasApi.getAll,
  })

  const createProforma = useMutation({
    mutationFn: proformasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] })
    },
  })

  const updateProforma = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proforma> }) =>
      proformasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] })
    },
  })

  const deleteProforma = useMutation({
    mutationFn: proformasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] })
    },
  })

  const convertToProposal = useMutation({
    mutationFn: proformasApi.convertToProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })

  return {
    proformas,
    createProforma,
    updateProforma,
    deleteProforma,
    convertToProposal,
  }
}
