import { useState } from 'react'
import { Proforma, ProformaStatus } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface ProformaFormProps {
  proforma?: Proforma
  onSubmit: (data: Partial<Proforma>) => void
  onCancel: () => void
  isLoading?: boolean
}

const statusOptions: { value: ProformaStatus; label: string }[] = [
  { value: 'requested', label: 'Requested' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
]

export function ProformaForm({ proforma, onSubmit, onCancel, isLoading }: ProformaFormProps) {
  const [formData, setFormData] = useState({
    client_name: proforma?.client_name || '',
    client_email: proforma?.client_email || '',
    amount: proforma?.amount || 0,
    status: proforma?.status || 'requested',
    requested_at: proforma?.requested_at || '',
    notes: proforma?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: Partial<Proforma> = {
      client_name: formData.client_name,
      client_email: formData.client_email || undefined,
      amount: formData.amount,
      status: formData.status,
      notes: formData.notes || undefined,
    }

    if (formData.requested_at) {
      submitData.requested_at = new Date(formData.requested_at).toISOString()
    }

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client_name">Client Name *</Label>
        <Input
          id="client_name"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_email">Client Email</Label>
        <Input
          id="client_email"
          type="email"
          value={formData.client_email}
          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
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
          onValueChange={(value) => setFormData({ ...formData, status: value as ProformaStatus })}
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
        <Label htmlFor="requested_at">Requested Date</Label>
        <Input
          id="requested_at"
          type="date"
          value={formData.requested_at ? formData.requested_at.slice(0, 10) : ''}
          onChange={(e) => setFormData({ ...formData, requested_at: e.target.value })}
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
          {isLoading ? 'Saving...' : proforma ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
