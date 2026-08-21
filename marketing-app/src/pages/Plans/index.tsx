import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { usePlans } from '../../lib/hooks/usePlans'
import { Plan } from '../../types/database'
import { navigation } from '../../lib/navigation'
import { PlanList } from '../../components/modules/plans/PlanList'
import { PlanForm } from '../../components/modules/plans/PlanForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

const section = navigation.find((s) => s.label === 'Plans')!

export default function PlansPage() {
  const { filter } = useParams()
  const { plans, createPlan, updatePlan, deletePlan } = usePlans()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>()

  const filtered = useMemo(() => {
    if (!filter) return plans.data || []
    return (plans.data || []).filter((p) => {
      if (['annual', 'quarterly', 'monthly', 'weekly'].includes(filter)) {
        return p.type === filter
      }
      if (['draft', 'active', 'archived'].includes(filter)) {
        return p.status === filter
      }
      return false
    })
  }, [plans.data, filter])

  const activeItem = section.children.find((item) => item.path === `/plans${filter ? '/' + filter : ''}`)

  const handleCreate = () => {
    setEditingPlan(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await deletePlan.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Plan>) => {
    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, data })
    } else {
      await createPlan.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingPlan(undefined)
  }

  if (plans.isLoading) {
    return <div className="text-center py-12">Loading plans...</div>
  }

  if (plans.error) {
    return <div className="text-center py-12 text-red-600">Error loading plans</div>
  }

  return (
    <>
      <ModuleTabs section={section} className="mb-2" />
      <PlanList
        plans={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : 'Plans'}
        emptyMessage={filter ? `No ${activeItem?.label.toLowerCase() || 'matching'} plans` : 'No plans yet'}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <PlanForm
            plan={editingPlan}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createPlan.isPending || updatePlan.isPending}
            plans={plans.data || []}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
