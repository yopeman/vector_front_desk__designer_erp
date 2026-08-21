import { Plan } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface PlanCardProps {
  plan: Plan
  onEdit: (plan: Plan) => void
  onDelete: (id: string) => void
  parentPlanName?: string
}

const typeLabels: Record<string, string> = {
  annual: 'Annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
  weekly: 'Weekly',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
}

export function PlanCard({ plan, onEdit, onDelete, parentPlanName }: PlanCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(plan)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(plan.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge className={statusColors[plan.status]}>{plan.status}</Badge>
          <Badge variant="outline">{typeLabels[plan.type]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {plan.description && (
          <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
        )}
        {parentPlanName && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Parent Plan:</span>
            <span className="font-medium">{parentPlanName}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Start:</span>{' '}
            <span className="font-medium">{new Date(plan.start_date).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500">End:</span>{' '}
            <span className="font-medium">{new Date(plan.end_date).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Target Revenue:</span>{' '}
            <span className="font-medium">${plan.target_revenue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Target Leads:</span>{' '}
            <span className="font-medium">{plan.target_leads}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
