import { useMemo, useState } from 'react'
import { ProductService } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { formatCurrency } from '../../../lib/utils/formatters'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface ProductListProps {
  products: ProductService[]
  onEdit: (product: ProductService) => void
  onDelete: (id: string) => void
  onCreate: () => void
  title?: string
  createLabel?: string
  emptyMessage?: string
}

export function ProductList({
  products,
  onEdit,
  onDelete,
  onCreate,
  title = 'Products / Services',
  createLabel = 'Add Product',
  emptyMessage = 'No products or services yet',
}: ProductListProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [products, search, typeFilter])

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{emptyMessage}</p>
          <Button onClick={onCreate}>{createLabel}</Button>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-gray-800">
            <Input
              placeholder="Search by name, category or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-white text-gray-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="capitalize">{product.type}</TableCell>
                    <TableCell>{product.category || '—'}</TableCell>
                    <TableCell>{product.sku || '—'}</TableCell>
                    <TableCell>{formatCurrency(product.unit_cost)}</TableCell>
                    <TableCell className="font-medium text-primary">{formatCurrency(product.unit_price)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(product.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
