import { useState } from 'react'
import { useProposals } from '../../lib/hooks/useProposals'
import { Proposal } from '../../types/database'
import { ProposalList } from '../../components/modules/proposals/ProposalList'
import { ProposalForm } from '../../components/modules/proposals/ProposalForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function ProposalsPage() {
  const { proposals, createProposal, updateProposal, deleteProposal } = useProposals()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProposal, setEditingProposal] = useState<Proposal | undefined>()

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
      <ProposalList
        proposals={proposals.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
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
