import { useState } from 'react'
import { Tender, TenderStatus } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface TenderFormProps {
  tender?: Tender
  onSubmit: (data: Partial<Tender>) => void
  onCancel: () => void
  isLoading?: boolean
}

const statusOptions: { value: TenderStatus; label: string }[] = [
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'preparation', label: 'Preparation' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

export function TenderForm({ tender, onSubmit, onCancel, isLoading }: TenderFormProps) {
  const [formData, setFormData] = useState({
    title: tender?.title || '',
    client_name: tender?.client_name || '',
    amount: tender?.amount || 0,
    status: tender?.status || 'opportunity',
    deadline: tender?.deadline || '',
    notes: tender?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only include date fields if they have values
    const submitData: Partial<Tender> = {
      title: formData.title,
      client_name: formData.client_name || undefined,
      amount: formData.amount,
      status: formData.status,
      notes: formData.notes || undefined,
    }
    
    if (formData.deadline) {
      submitData.deadline = formData.deadline
    }
    
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_name">Client Name</Label>
        <Input
          id="client_name"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as TenderStatus })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="text-white" disabled={isLoading}>
          {isLoading ? 'Saving...' : tender ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
