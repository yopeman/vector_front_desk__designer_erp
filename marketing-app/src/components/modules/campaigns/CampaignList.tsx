import { Campaign } from '../../../types/database'
import { CampaignCard } from './CampaignCard'
import { Button } from '../../ui/button'

interface CampaignListProps {
  campaigns: Campaign[]
  onEdit: (campaign: Campaign) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export function CampaignList({ campaigns, onEdit, onDelete, onCreate }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No campaigns yet</p>
        <Button onClick={onCreate}>Create Campaign</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaigns</h2>
        <Button onClick={onCreate}>Create Campaign</Button>
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
