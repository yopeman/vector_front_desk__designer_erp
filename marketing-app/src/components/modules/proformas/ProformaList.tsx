import { Proforma } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { StatusBadge } from '../../shared/StatusBadge'
import { Button } from '../../ui/button'
import { formatCurrency } from '../../../lib/utils/formatters'

interface ProformaListProps {
  proformas: Proforma[]
  onEdit: (proforma: Proforma) => void
  onDelete: (id: string) => void
  onView: (proforma: Proforma) => void
  onCreate: () => void
  title?: string
  createLabel?: string
  emptyMessage?: string
}

export function ProformaList({
  proformas,
  onEdit,
  onDelete,
  onView,
  onCreate,
  title = 'Proformas',
  createLabel = 'Create Proforma',
  emptyMessage = 'No proformas yet',
}: ProformaListProps) {
  if (proformas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{emptyMessage}</p>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proformas.map((proforma) => (
          <Card key={proforma.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{proforma.client_name}</CardTitle>
                <StatusBadge status={proforma.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {proforma.client_email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span>{proforma.client_email}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{formatCurrency(proforma.amount)}</span>
                </div>
                {proforma.requested_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Requested:</span>
                    <span>{new Date(proforma.requested_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onView(proforma)}>
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(proforma)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(proforma.id)}>
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
