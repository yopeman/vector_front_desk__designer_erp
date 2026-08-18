import { Tender } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { StatusBadge } from '../../shared/StatusBadge'
import { Button } from '../../ui/button'
import { formatCurrency } from '../../../lib/utils/formatters'

interface TenderListProps {
  tenders: Tender[]
  onEdit: (tender: Tender) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export function TenderList({ tenders, onEdit, onDelete, onCreate }: TenderListProps) {
  if (tenders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No tenders yet</p>
        <Button onClick={onCreate}>Create Tender</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tenders</h2>
        <Button onClick={onCreate}>Create Tender</Button>
      </div>
      <div className="space-y-3">
        {tenders.map((tender) => (
          <Card key={tender.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{tender.title}</CardTitle>
                <StatusBadge status={tender.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tender.client_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Client:</span>
                    <span>{tender.client_name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{formatCurrency(tender.amount)}</span>
                </div>
                {tender.deadline && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deadline:</span>
                    <span>{new Date(tender.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(tender)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(tender.id)}>
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
