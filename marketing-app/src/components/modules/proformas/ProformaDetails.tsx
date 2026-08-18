import { Proforma } from '../../../types/database'
import { Button } from '../../ui/button'
import { StatusBadge } from '../../shared/StatusBadge'
import { formatCurrency, formatDate } from '../../../lib/utils/formatters'
import { LineItemsForm } from './LineItemsForm'
import { ArrowRight } from 'lucide-react'

interface ProformaDetailsProps {
  proforma: Proforma
  onEdit: () => void
  onClose: () => void
  onConvert: (proformaId: string) => void
  isConverting?: boolean
}

export function ProformaDetails({ proforma, onEdit, onClose, onConvert, isConverting }: ProformaDetailsProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{proforma.client_name}</h3>
            <StatusBadge status={proforma.status} />
          </div>
          {proforma.client_email && (
            <p className="text-sm text-gray-500 mt-1">{proforma.client_email}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(proforma.amount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Requested</p>
          <p>{proforma.requested_at ? formatDate(proforma.requested_at) : '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Submitted</p>
          <p>{proforma.submitted_at ? formatDate(proforma.submitted_at) : '—'}</p>
        </div>
        {proforma.notes && (
          <div className="col-span-2">
            <p className="text-gray-500">Notes</p>
            <p>{proforma.notes}</p>
          </div>
        )}
      </div>

      <LineItemsForm proformaId={proforma.id} />

      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button
          onClick={() => onConvert(proforma.id)}
          disabled={isConverting}
        >
          <ArrowRight className="w-4 h-4 mr-1" />
          {isConverting ? 'Converting...' : 'Convert to Proposal'}
        </Button>
      </div>
    </div>
  )
}
