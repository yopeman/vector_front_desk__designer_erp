import { useState } from 'react'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { Campaign } from '../../types/database'
import { CampaignList } from '../../components/modules/campaigns/CampaignList'
import { CampaignForm } from '../../components/modules/campaigns/CampaignForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function CampaignsPage() {
  const { campaigns, createCampaign, updateCampaign, deleteCampaign } = useCampaigns()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>()

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
      <CampaignList
        campaigns={campaigns.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
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
