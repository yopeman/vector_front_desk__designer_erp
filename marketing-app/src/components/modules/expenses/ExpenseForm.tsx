import { useState } from 'react'
import { Expense, ExpenseCategory } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { useCampaigns } from '../../../lib/hooks/useCampaigns'

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (data: Partial<Expense>) => void
  onCancel: () => void
  isLoading?: boolean
}

const categoryOptions: { value: ExpenseCategory; label: string }[] = [
  { value: 'advertising', label: 'Advertising' },
  { value: 'content', label: 'Content' },
  { value: 'events', label: 'Events' },
  { value: 'travel', label: 'Travel' },
  { value: 'software', label: 'Software' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'other', label: 'Other' },
]

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const { campaigns } = useCampaigns()
  const [formData, setFormData] = useState({
    category: (expense?.category || 'other') as ExpenseCategory,
    campaign_id: expense?.campaign_id || '',
    description: expense?.description || '',
    amount: expense?.amount || 0,
    expense_date: expense?.expense_date || new Date().toISOString().slice(0, 10),
    receipt_url: expense?.receipt_url || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: Partial<Expense> = {
      category: formData.category,
      campaign_id: formData.campaign_id || undefined,
      description: formData.description || undefined,
      amount: formData.amount,
      expense_date: formData.expense_date,
      receipt_url: formData.receipt_url || undefined,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign_id">Campaign</Label>
        <Select
          value={formData.campaign_id || '__none'}
          onValueChange={(value) =>
            setFormData({ ...formData, campaign_id: value && value !== '__none' ? value : '' })
          }
          disabled={isLoading || campaigns.isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No campaign</SelectItem>
            {(campaigns.data || []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense_date">Expense Date *</Label>
        <Input
          id="expense_date"
          type="date"
          value={formData.expense_date}
          onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt_url">Receipt URL</Label>
        <Input
          id="receipt_url"
          value={formData.receipt_url}
          onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
          placeholder="https://..."
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="text-white" disabled={isLoading}>
          {isLoading ? 'Saving...' : expense ? 'Update' : 'Submit'}
        </Button>
      </div>
    </form>
  )
}
