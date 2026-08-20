import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils/cn'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Campaign Status
  planned: { label: 'Planned', className: 'bg-blue-100 text-blue-800' },
  active: { label: 'Active', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
  on_hold: { label: 'On Hold', className: 'bg-yellow-100 text-yellow-800' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600' },
  
  // Activity Status
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
  
  // Proposal/Proforma/Tender Status
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800' },
  follow_up: { label: 'Follow Up', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  requested: { label: 'Requested', className: 'bg-purple-100 text-purple-800' },
  opportunity: { label: 'Opportunity', className: 'bg-blue-100 text-blue-800' },
  preparation: { label: 'Preparation', className: 'bg-yellow-100 text-yellow-800' },
  awarded: { label: 'Awarded', className: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', className: 'bg-red-100 text-red-800' },
  
  // Expense Approval Status
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
