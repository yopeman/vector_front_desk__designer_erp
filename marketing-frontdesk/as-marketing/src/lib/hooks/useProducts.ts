import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../api/products'
import { ProductService } from '../../types/database'

export function useProducts() {
  const queryClient = useQueryClient()

  const products = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  })

  const createProduct = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductService> }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteProduct = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return {
    products,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
