import { useState } from 'react'
import { useProformas } from '../../lib/hooks/useProformas'
import { Proforma } from '../../types/database'
import { ProformaList } from '../../components/modules/proformas/ProformaList'
import { ProformaForm } from '../../components/modules/proformas/ProformaForm'
import { ProformaDetails } from '../../components/modules/proformas/ProformaDetails'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function ProformasPage() {
  const { proformas, createProforma, updateProforma, deleteProforma, convertToProposal } = useProformas()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProforma, setEditingProforma] = useState<Proforma | undefined>()
  const [viewingProforma, setViewingProforma] = useState<Proforma | undefined>()
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingProforma(undefined)
    setViewingProforma(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (proforma: Proforma) => {
    setViewingProforma(undefined)
    setEditingProforma(proforma)
    setIsFormOpen(true)
  }

  const handleEditFromDetails = () => {
    if (!viewingProforma) return
    setEditingProforma(viewingProforma)
    setIsFormOpen(true)
  }

  const handleView = (proforma: Proforma) => {
    setViewingProforma(proforma)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this proforma?')) {
      await deleteProforma.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Proforma>) => {
    if (editingProforma) {
      await updateProforma.mutateAsync({ id: editingProforma.id, data })
      // keep the details dialog in sync with the edited record
      if (viewingProforma?.id === editingProforma.id) {
        setViewingProforma({ ...viewingProforma, ...data })
      }
    } else {
      await createProforma.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingProforma(undefined)
  }

  const handleConvert = async (proformaId: string) => {
    setConvertingId(proformaId)
    try {
      await convertToProposal.mutateAsync(proformaId)
      alert('Proforma converted to proposal successfully.')
    } finally {
      setConvertingId(null)
    }
  }

  if (proformas.isLoading) {
    return <div className="text-center py-12">Loading proformas...</div>
  }

  if (proformas.error) {
    return <div className="text-center py-12 text-red-600">Error loading proformas</div>
  }

  return (
    <>
      <ProformaList
        proformas={proformas.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onCreate={handleCreate}
      />

      {/* Create / Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProforma ? 'Edit Proforma' : 'Create Proforma'}</DialogTitle>
          </DialogHeader>
          <ProformaForm
            proforma={editingProforma}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createProforma.isPending || updateProforma.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog open={!!viewingProforma} onOpenChange={(open) => !open && setViewingProforma(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proforma Details</DialogTitle>
          </DialogHeader>
          {viewingProforma && (
            <ProformaDetails
              proforma={viewingProforma}
              onEdit={handleEditFromDetails}
              onClose={() => setViewingProforma(undefined)}
              onConvert={handleConvert}
              isConverting={convertingId === viewingProforma.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
