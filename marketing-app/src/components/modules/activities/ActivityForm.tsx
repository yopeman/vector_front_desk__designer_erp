import { useState, useEffect } from 'react'
import { Activity, ActivityType, ActivityStatus, ChecklistItem } from '../../../types/database'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Checkbox } from '../../ui/checkbox'
import { Trash2, Plus, Upload } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'

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
    checklists: activity?.checklists || [],
    attachments: activity?.attachments || [],
  })
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})

  const getFileUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('activity-attachments')
        .createSignedUrl(filePath, 3600)
      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  }

  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {}
      for (const attachment of formData.attachments) {
        const url = await getFileUrl(attachment)
        if (url) {
          urls[attachment] = url
        }
      }
      setAttachmentUrls(urls)
    }
    loadUrls()
  }, [formData.attachments])

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: '',
      completed: false,
    }
    setFormData({ ...formData, checklists: [...formData.checklists, newItem] })
  }

  const updateChecklistItem = (id: string, text: string) => {
    setFormData({
      ...formData,
      checklists: formData.checklists.map(item => 
        item.id === id ? { ...item, text } : item
      ),
    })
  }

  const toggleChecklistItem = (id: string) => {
    setFormData({
      ...formData,
      checklists: formData.checklists.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    })
  }

  const removeChecklistItem = (id: string) => {
    setFormData({
      ...formData,
      checklists: formData.checklists.filter(item => item.id !== id),
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: string[] = []
    
    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('activity-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          continue
        }

        newAttachments.push(filePath)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    if (newAttachments.length > 0) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...newAttachments],
      })
    }
  }

  const removeAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only include date fields if they have values
    const submitData: Partial<Activity> = {
      title: formData.title,
      type: formData.type,
      status: formData.status,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      checklists: formData.checklists,
      attachments: formData.attachments,
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Tasks</Label>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={addChecklistItem}
            disabled={isLoading}
          >
            <Plus className="size-3" />
            Add Task
          </Button>
        </div>
        <div className="space-y-2">
          {formData.checklists.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleChecklistItem(item.id)}
                disabled={isLoading}
              />
              <Input
                value={item.text}
                onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                placeholder="Task"
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeChecklistItem(item.id)}
                disabled={isLoading}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={isLoading}
            multiple
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <Upload className="size-4" />
          </Button>
        </div>
        {formData.attachments.length > 0 && (
          <div className="space-y-1">
            {formData.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm p-2 bg-muted rounded"
              >
                <a
                  href={attachmentUrls[attachment] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-blue-600 hover:text-blue-800 hover:underline flex-1 mr-2"
                  onClick={(e) => {
                    if (!attachmentUrls[attachment]) {
                      e.preventDefault()
                    }
                  }}
                >
                  {attachment}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeAttachment(index)}
                  disabled={isLoading}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
