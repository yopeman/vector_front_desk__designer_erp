import { useState } from 'react'
import { useProducts } from '../../lib/hooks/useProducts'
import { ProductService } from '../../types/database'
import { ProductList } from '../../components/modules/products/ProductList'
import { ProductForm } from '../../components/modules/products/ProductForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function ProductsPage() {
  const { products, createProduct, updateProduct, deleteProduct } = useProducts()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductService | undefined>()

  const handleCreate = () => {
    setEditingProduct(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (product: ProductService) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product/service?')) {
      await deleteProduct.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<ProductService>) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, data })
    } else {
      await createProduct.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingProduct(undefined)
  }

  if (products.isLoading) {
    return <div className="text-center py-12">Loading products...</div>
  }

  if (products.error) {
    return <div className="text-center py-12 text-red-600">Error loading products</div>
  }

  return (
    <>
      <ProductList
        products={products.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createProduct.isPending || updateProduct.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
