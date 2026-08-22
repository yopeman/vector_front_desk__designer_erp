import { useState } from 'react'
import { MarketInsight, InsightType } from '../../../types/database'
import { useCampaigns } from '../../../lib/hooks/useCampaigns'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface MarketInsightFormProps {
  insight?: MarketInsight
  onSubmit: (data: Partial<MarketInsight>) => void
  onCancel: () => void
  isLoading?: boolean
}

const typeOptions: { value: InsightType; label: string }[] = [
  { value: 'customer_need', label: 'Customer Need' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'market_trend', label: 'Market Trend' },
  { value: 'new_opportunity', label: 'New Opportunity' },
]

export function MarketInsightForm({ insight, onSubmit, onCancel, isLoading }: MarketInsightFormProps) {
  const { campaigns } = useCampaigns()
  const [formData, setFormData] = useState({
    type: (insight?.type || 'customer_need') as InsightType,
    title: insight?.title || '',
    description: insight?.description || '',
    source: insight?.source || '',
    relevance_score: insight?.relevance_score?.toString() || '',
    date_identified: insight?.date_identified || new Date().toISOString().slice(0, 10),
    campaign_id: insight?.campaign_id || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: Partial<MarketInsight> = {
      type: formData.type,
      title: formData.title,
      description: formData.description || undefined,
      source: formData.source || undefined,
      relevance_score: formData.relevance_score ? parseInt(formData.relevance_score, 10) : undefined,
      date_identified: formData.date_identified,
      campaign_id: formData.campaign_id || undefined,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as InsightType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="id_title">Title *</Label>
        <Input
          id="id_title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="id_description">Description</Label>
        <Input
          id="id_description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id_source">Source</Label>
          <Input
            id="id_source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_relevance">Relevance (1-10)</Label>
          <Input
            id="id_relevance"
            type="number"
            min={1}
            max={10}
            value={formData.relevance_score}
            onChange={(e) => setFormData({ ...formData, relevance_score: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id_date">Date Identified</Label>
          <Input
            id="id_date"
            type="date"
            value={formData.date_identified}
            onChange={(e) => setFormData({ ...formData, date_identified: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Campaign</Label>
          <Select
            value={formData.campaign_id || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, campaign_id: value === 'none' ? '' : value ?? '' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {(campaigns.data || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="text-white" disabled={isLoading}>
          {isLoading ? 'Saving...' : insight ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  )
}