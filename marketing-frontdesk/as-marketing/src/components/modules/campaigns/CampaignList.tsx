import { Campaign } from '../../../types/database'
import { CampaignCard } from './CampaignCard'
import { Button } from '../../ui/button'

interface CampaignListProps {
  campaigns: Campaign[]
  onEdit: (campaign: Campaign) => void
  onDelete: (id: string) => void
  onCreate: () => void
  title?: string
  createLabel?: string
  emptyMessage?: string
}

export function CampaignList({
  campaigns,
  onEdit,
  onDelete,
  onCreate,
  title = 'Campaigns',
  createLabel = 'Create Campaign',
  emptyMessage = 'No campaigns yet',
}: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{emptyMessage}</p>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
