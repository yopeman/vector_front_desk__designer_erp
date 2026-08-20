import { useState } from 'react'
import { Proposal, ProposalStatus } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface ProposalFormProps {
  proposal?: Proposal
  onSubmit: (data: Partial<Proposal>) => void
  onCancel: () => void
  isLoading?: boolean
}

const statusOptions: { value: ProposalStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
]

export function ProposalForm({ proposal, onSubmit, onCancel, isLoading }: ProposalFormProps) {
  const [formData, setFormData] = useState({
    client_name: proposal?.client_name || '',
    client_email: proposal?.client_email || '',
    amount: proposal?.amount || 0,
    status: proposal?.status || 'draft',
    notes: proposal?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only include date fields if they have values
    const submitData: Partial<Proposal> = {
      client_name: formData.client_name,
      client_email: formData.client_email || undefined,
      amount: formData.amount,
      status: formData.status,
      notes: formData.notes || undefined,
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
          onValueChange={(value) => setFormData({ ...formData, status: value as ProposalStatus })}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : proposal ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
