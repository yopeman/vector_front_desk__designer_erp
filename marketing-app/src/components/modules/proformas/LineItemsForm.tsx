import { useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { useProformaItems } from '../../../lib/hooks/useProformaItems'
import { useProducts } from '../../../lib/hooks/useProducts'
import { formatCurrency } from '../../../lib/utils/formatters'

interface LineItemsFormProps {
  proformaId: string
}

export function LineItemsForm({ proformaId }: LineItemsFormProps) {
  const { items, addItem, deleteItem } = useProformaItems(proformaId)
  const { products } = useProducts()
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [productId, setProductId] = useState<string | undefined>()

  const handleAdd = async () => {
    if (!description.trim()) return
    await addItem.mutateAsync({
      proforma_id: proformaId,
      description: description.trim(),
      quantity,
      unit_price: unitPrice,
      product_service_id: productId || undefined,
    })
    setDescription('')
    setQuantity(1)
    setUnitPrice(0)
    setProductId(undefined)
  }

  const total = (items.data || []).reduce((sum, item) => sum + Number(item.total || 0), 0)

  return (
    <div className="space-y-4">
      <div className="text-gray-800">
        <h4 className="text-sm font-medium mb-2">Line Items</h4>
        {items.isLoading ? (
          <p className="text-sm text-gray-500">Loading items...</p>
        ) : (items.data || []).length === 0 ? (
          <p className="text-sm text-gray-500">No line items yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items.data || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(Number(item.unit_price))}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(item.total))}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem.mutate(item.id)}
                      disabled={deleteItem.isPending}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-medium">Add Item</h4>
        <div className="space-y-2">
          <Label htmlFor="item_description">Description *</Label>
          <Input
            id="item_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Branding package"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item_product">Product / Service</Label>
          <Select value={productId} onValueChange={(value) => setProductId(value ?? undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Select product/service" />
            </SelectTrigger>
            <SelectContent>
              {(products.data || []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="item_qty">Quantity</Label>
            <Input
              id="item_qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item_price">Unit Price</Label>
            <Input
              id="item_price"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Subtotal: {formatCurrency(total)}</span>
          <Button onClick={handleAdd} disabled={addItem.isPending || !description.trim()}>
            {addItem.isPending ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </div>
    </div>
  )
}
