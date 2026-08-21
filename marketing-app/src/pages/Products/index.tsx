import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useProducts } from '../../lib/hooks/useProducts'
import { ProductService } from '../../types/database'
import { navigation } from '../../lib/navigation'
import { ProductList } from '../../components/modules/products/ProductList'
import { ProductForm } from '../../components/modules/products/ProductForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

const section = navigation.find((s) => s.label === 'Product & Service')!

export default function ProductsPage() {
  const { filter } = useParams()
  const { products, createProduct, updateProduct, deleteProduct } = useProducts()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductService | undefined>()

  const filtered = useMemo(() => {
    if (!filter) return products.data || []
    return (products.data || []).filter((p) => p.type === filter)
  }, [products.data, filter])

  const activeItem = section.children.find(
    (item) => item.path === `/products${filter ? '/' + filter : ''}`
  )

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
      <ModuleTabs section={section} className="mb-2" />
      <ProductList
        products={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : 'Products / Services'}
        emptyMessage={filter ? `No ${activeItem?.label.toLowerCase() || 'matching'} found` : 'No products or services yet'}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
