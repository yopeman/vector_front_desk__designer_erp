import { useState } from 'react'
import { Activity, ActivityType, ActivityStatus } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface ActivityFormProps {
  activity?: Activity
  onSubmit: (data: Partial<Activity>) => void
  onCancel: () => void
  isLoading?: boolean
}

const typeOptions: { value: ActivityType; label: string }[] = [
  { value: 'content_production', label: 'Content Production' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'website', label: 'Website' },
  { value: 'paid_ad', label: 'Paid Ad' },
  { value: 'visit', label: 'Visit' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'demo', label: 'Demo' },
  { value: 'event', label: 'Event' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' },
]

const statusOptions: { value: ActivityStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

export function ActivityForm({ activity, onSubmit, onCancel, isLoading }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    title: activity?.title || '',
    type: activity?.type || 'other',
    status: activity?.status || 'planned',
    scheduled_start: activity?.scheduled_start || '',
    scheduled_end: activity?.scheduled_end || '',
    location: activity?.location || '',
    notes: activity?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only include date fields if they have values
    const submitData: Partial<Activity> = {
      title: formData.title,
      type: formData.type,
      status: formData.status,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    }
    
    if (formData.scheduled_start) {
      submitData.scheduled_start = formData.scheduled_start
    }
    if (formData.scheduled_end) {
      submitData.scheduled_end = formData.scheduled_end
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as ActivityType })}
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
            onValueChange={(value) => setFormData({ ...formData, status: value as ActivityStatus })}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_start">Start Date</Label>
          <Input
            id="scheduled_start"
            type="datetime-local"
            value={formData.scheduled_start}
            onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_end">End Date</Label>
          <Input
            id="scheduled_end"
            type="datetime-local"
            value={formData.scheduled_end}
            onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : activity ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
