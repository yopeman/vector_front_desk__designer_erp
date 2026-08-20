import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { Campaign } from '../../types/database'
import { navigation } from '../../lib/navigation'
import { CampaignList } from '../../components/modules/campaigns/CampaignList'
import { CampaignForm } from '../../components/modules/campaigns/CampaignForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

const section = navigation.find((s) => s.label === 'Campaigns')!

export default function CampaignsPage() {
  const { filter } = useParams()
  const { campaigns, createCampaign, updateCampaign, deleteCampaign } = useCampaigns()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>()

  const filtered = useMemo(() => {
    if (!filter) return campaigns.data || []
    return (campaigns.data || []).filter((c) => c.status === filter)
  }, [campaigns.data, filter])

  const activeItem = section.children.find((item) => item.path === `/campaigns${filter ? '/' + filter : ''}`)

  const handleCreate = () => {
    setEditingCampaign(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteCampaign.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Campaign>) => {
    if (editingCampaign) {
      await updateCampaign.mutateAsync({ id: editingCampaign.id, data })
    } else {
      await createCampaign.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingCampaign(undefined)
  }

  if (campaigns.isLoading) {
    return <div className="text-center py-12">Loading campaigns...</div>
  }

  if (campaigns.error) {
    return <div className="text-center py-12 text-red-600">Error loading campaigns</div>
  }

  return (
    <>
      <ModuleTabs section={section} className="mb-2" />
      <CampaignList
        campaigns={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : 'Campaigns'}
        emptyMessage={filter ? `No ${activeItem?.label.toLowerCase() || 'matching'} campaigns` : 'No campaigns yet'}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createCampaign.isPending || updateCampaign.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
