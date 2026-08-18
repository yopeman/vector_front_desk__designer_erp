import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useProposals } from '../../lib/hooks/useProposals'
import { Proposal } from '../../types/database'
import { navigation } from '../../lib/navigation'
import { ProposalList } from '../../components/modules/proposals/ProposalList'
import { ProposalForm } from '../../components/modules/proposals/ProposalForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

const section = navigation.find((s) => s.label === 'Proposals')!

export default function ProposalsPage() {
  const { filter } = useParams()
  const { proposals, createProposal, updateProposal, deleteProposal } = useProposals()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProposal, setEditingProposal] = useState<Proposal | undefined>()

  const filtered = useMemo(() => {
    if (!filter) return proposals.data || []
    return (proposals.data || []).filter((p) => p.status === filter)
  }, [proposals.data, filter])

  const activeItem = section.children.find(
    (item) => item.path === `/proposals${filter ? '/' + filter : ''}`
  )

  const handleCreate = () => {
    setEditingProposal(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      await deleteProposal.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Proposal>) => {
    if (editingProposal) {
      await updateProposal.mutateAsync({ id: editingProposal.id, data })
    } else {
      await createProposal.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingProposal(undefined)
  }

  if (proposals.isLoading) {
    return <div className="text-center py-12">Loading proposals...</div>
  }

  if (proposals.error) {
    return <div className="text-center py-12 text-red-600">Error loading proposals</div>
  }

  return (
    <>
      <ModuleTabs section={section} className="mb-2" />
      <ProposalList
        proposals={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : 'Proposals'}
        emptyMessage={filter ? `No ${activeItem?.label.toLowerCase() || 'matching'} proposals` : 'No proposals yet'}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProposal ? 'Edit Proposal' : 'Create Proposal'}</DialogTitle>
          </DialogHeader>
          <ProposalForm
            proposal={editingProposal}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createProposal.isPending || updateProposal.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
