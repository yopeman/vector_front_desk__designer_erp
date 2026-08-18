import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tendersApi } from '../api/tenders'
import { Tender } from '../../types/database'

export function useTenders() {
  const queryClient = useQueryClient()

  const tenders = useQuery({
    queryKey: ['tenders'],
    queryFn: tendersApi.getAll,
  })

  const createTender = useMutation({
    mutationFn: tendersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] })
    },
  })

  const updateTender = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tender> }) =>
      tendersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] })
    },
  })

  const deleteTender = useMutation({
    mutationFn: tendersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] })
    },
  })

  return {
    tenders,
    createTender,
    updateTender,
    deleteTender,
  }
}
