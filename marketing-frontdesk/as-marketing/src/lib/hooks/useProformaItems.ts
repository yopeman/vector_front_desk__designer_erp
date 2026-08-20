import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proformasApi } from '../api/proformas'
import { ProformaItem } from '../../types/database'

type ItemInput = Omit<ProformaItem, 'id' | 'created_at' | 'total'>

export function useProformaItems(proformaId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['proforma-items', proformaId]

  const items = useQuery({
    queryKey,
    queryFn: () => proformasApi.getItems(proformaId),
    enabled: !!proformaId,
  })

  const addItem = useMutation({
    mutationFn: (item: ItemInput) => proformasApi.addItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemInput> }) =>
      proformasApi.updateItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteItem = useMutation({
    mutationFn: proformasApi.deleteItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { items, addItem, updateItem, deleteItem }
}
