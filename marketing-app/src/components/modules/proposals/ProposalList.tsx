import { Proposal } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { StatusBadge } from '../../shared/StatusBadge'
import { Button } from '../../ui/button'
import { formatCurrency } from '../../../lib/utils/formatters'

interface ProposalListProps {
  proposals: Proposal[]
  onEdit: (proposal: Proposal) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export function ProposalList({ proposals, onEdit, onDelete, onCreate }: ProposalListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No proposals yet</p>
        <Button onClick={onCreate}>Create Proposal</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Proposals</h2>
        <Button onClick={onCreate}>Create Proposal</Button>
      </div>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{proposal.client_name}</CardTitle>
                <StatusBadge status={proposal.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {proposal.client_email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span>{proposal.client_email}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{formatCurrency(proposal.amount)}</span>
                </div>
                {proposal.submitted_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Submitted:</span>
                    <span>{new Date(proposal.submitted_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(proposal)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(proposal.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
