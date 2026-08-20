import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTenders } from '../../lib/hooks/useTenders'
import { Tender } from '../../types/database'
import { navigation } from '../../lib/navigation'
import { TenderList } from '../../components/modules/tenders/TenderList'
import { TenderForm } from '../../components/modules/tenders/TenderForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

const section = navigation.find((s) => s.label === 'Tenders')!

export default function TendersPage() {
  const { filter } = useParams()
  const { tenders, createTender, updateTender, deleteTender } = useTenders()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTender, setEditingTender] = useState<Tender | undefined>()

  const filtered = useMemo(() => {
    if (!filter) return tenders.data || []
    return (tenders.data || []).filter((t) => t.status === filter)
  }, [tenders.data, filter])

  const activeItem = section.children.find(
    (item) => item.path === `/tenders${filter ? '/' + filter : ''}`
  )

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
      <ModuleTabs section={section} className="mb-2" />
      <TenderList
        tenders={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : 'Tenders'}
        emptyMessage={filter ? `No ${activeItem?.label.toLowerCase() || 'matching'} tenders` : 'No tenders yet'}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingTender ? 'Edit Tender' : 'Create Tender'}</DialogTitle>
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
