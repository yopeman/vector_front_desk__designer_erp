import { useState } from 'react'
import { ProductService } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface ProductFormProps {
  product?: ProductService
  onSubmit: (data: Partial<ProductService>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    type: (product?.type || 'product') as 'product' | 'service',
    category: product?.category || '',
    sku: product?.sku || '',
    unit_cost: product?.unit_cost || 0,
    unit_price: product?.unit_price || 0,
    description: product?.description || '',
    marketing: product?.marketing || '',
    strategy: product?.strategy || '',
    date: product?.date || '',
    status: product?.status || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: Partial<ProductService> = {
      name: formData.name,
      type: formData.type,
      category: formData.category || undefined,
      sku: formData.sku || undefined,
      unit_cost: formData.unit_cost,
      unit_price: formData.unit_price,
      description: formData.description || undefined,
      marketing: formData.marketing || undefined,
      strategy: formData.strategy || undefined,
      date: formData.date || undefined,
      status: formData.status || undefined,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as 'product' | 'service' })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="e.g. SKU-001"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input
            id="unit_cost"
            type="number"
            min="0"
            step="0.01"
            value={formData.unit_cost}
            onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price</Label>
          <Input
            id="unit_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="marketing">Marketing</Label>
          <Input
            id="marketing"
            value={formData.marketing}
            onChange={(e) => setFormData({ ...formData, marketing: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="strategy">Strategy</Label>
          <Input
            id="strategy"
            value={formData.strategy}
            onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Input
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : product ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
