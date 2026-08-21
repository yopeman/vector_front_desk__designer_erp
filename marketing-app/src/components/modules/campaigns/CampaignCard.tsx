import { Campaign } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { StatusBadge } from '../../shared/StatusBadge'
import { Button } from '../../ui/button'
import { formatCurrency } from '../../../lib/utils/formatters'

interface CampaignCardProps {
  campaign: Campaign
  onEdit: (campaign: Campaign) => void
  onDelete: (id: string) => void
  planName?: string
}

export function CampaignCard({ campaign, onEdit, onDelete, planName }: CampaignCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{campaign.name}</CardTitle>
          <StatusBadge status={campaign.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {campaign.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
          )}
          {planName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plan:</span>
              <span className="font-medium">{planName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Budget:</span>
            <span className="font-medium">{formatCurrency(campaign.budget_estimated)}</span>
          </div>
          {campaign.start_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start:</span>
              <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {campaign.end_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">End:</span>
              <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onEdit(campaign)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(campaign.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
