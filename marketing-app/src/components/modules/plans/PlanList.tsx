import { Plan } from '../../../types/database'
import { PlanCard } from './PlanCard'
import { Button } from '../../ui/button'
import { Plus } from 'lucide-react'

interface PlanListProps {
  plans: Plan[]
  onEdit: (plan: Plan) => void
  onDelete: (id: string) => void
  onCreate: () => void
  title: string
  emptyMessage: string
}

export function PlanList({ plans, onEdit, onDelete, onCreate, title, emptyMessage }: PlanListProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
