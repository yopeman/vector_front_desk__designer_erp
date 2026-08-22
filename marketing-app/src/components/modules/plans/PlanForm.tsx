import { useState, useMemo } from 'react'
import { Plan, PlanType, PlanStatus } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface PlanFormProps {
  plan?: Plan
  onSubmit: (data: Partial<Plan>) => void
  onCancel: () => void
  isLoading?: boolean
  plans?: Plan[]
}

const typeOptions: { value: PlanType; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
]

const statusOptions: { value: PlanStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

export function PlanForm({ plan, onSubmit, onCancel, isLoading, plans = [] }: PlanFormProps) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    type: plan?.type || 'annual',
    status: plan?.status || 'draft',
    parent_plan_id: plan?.parent_plan_id || '',
    start_date: plan?.start_date || '',
    end_date: plan?.end_date || '',
    target_revenue: plan?.target_revenue || 0,
    target_leads: plan?.target_leads || 0,
    notes: plan?.notes || '',
  })

  // Filter parent plans based on the selected type
  const availableParentPlans = useMemo(() => {
    if (formData.type === 'annual') {
      // Annual plans have no parent
      return []
    } else if (formData.type === 'quarterly') {
      // Quarterly plans can have annual parents
      return plans.filter(p => p.type === 'annual' && p.id !== plan?.id)
    } else if (formData.type === 'monthly') {
      // Monthly plans can have annual or quarterly parents
      return plans.filter(p => (p.type === 'annual' || p.type === 'quarterly') && p.id !== plan?.id)
    } else if (formData.type === 'weekly') {
      // Weekly plans can have monthly parents
      return plans.filter(p => p.type === 'monthly' && p.id !== plan?.id)
    }
    return []
  }, [formData.type, plans, plan?.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: Partial<Plan> = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      status: formData.status,
      parent_plan_id: formData.parent_plan_id || undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      target_revenue: formData.target_revenue,
      target_leads: formData.target_leads,
      notes: formData.notes || undefined,
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
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as PlanType })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as PlanStatus })}
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
      </div>

      {formData.type !== 'annual' && (
        <div className="space-y-2">
          <Label htmlFor="parent_plan_id">Parent Plan</Label>
          <Select
            value={formData.parent_plan_id}
            onValueChange={(value) => setFormData({ ...formData, parent_plan_id: value || '' })}
            disabled={isLoading || availableParentPlans.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={availableParentPlans.length === 0 ? 'No parent plans available' : 'Select a parent plan'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No parent</SelectItem>
              {availableParentPlans.map((parentPlan) => (
                <SelectItem key={parentPlan.id} value={parentPlan.id}>
                  {parentPlan.name} ({parentPlan.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target_revenue">Target Revenue</Label>
          <Input
            id="target_revenue"
            type="number"
            step="0.01"
            value={formData.target_revenue}
            onChange={(e) => setFormData({ ...formData, target_revenue: parseFloat(e.target.value) || 0 })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_leads">Target Leads</Label>
          <Input
            id="target_leads"
            type="number"
            value={formData.target_leads}
            onChange={(e) => setFormData({ ...formData, target_leads: parseInt(e.target.value) || 0 })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="text-white" disabled={isLoading}>
          {isLoading ? 'Saving...' : plan ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
