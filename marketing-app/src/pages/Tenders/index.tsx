import { useState } from 'react'
import { useTenders } from '../../lib/hooks/useTenders'
import { Tender } from '../../types/database'
import { TenderList } from '../../components/modules/tenders/TenderList'
import { TenderForm } from '../../components/modules/tenders/TenderForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function TendersPage() {
  const { tenders, createTender, updateTender, deleteTender } = useTenders()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTender, setEditingTender] = useState<Tender | undefined>()

  const handleCreate = () => {
    setEditingTender(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (tender: Tender) => {
    setEditingTender(tender)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tender?')) {
      await deleteTender.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Tender>) => {
    if (editingTender) {
      await updateTender.mutateAsync({ id: editingTender.id, data })
    } else {
      await createTender.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingTender(undefined)
  }

  if (tenders.isLoading) {
    return <div className="text-center py-12">Loading tenders...</div>
  }

  if (tenders.error) {
    return <div className="text-center py-12 text-red-600">Error loading tenders</div>
  }

  return (
    <>
      <TenderList
        tenders={tenders.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTender ? 'Edit Tender' : 'Create Tender'}</DialogTitle>
          </DialogHeader>
          <TenderForm
            tender={editingTender}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createTender.isPending || updateTender.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
