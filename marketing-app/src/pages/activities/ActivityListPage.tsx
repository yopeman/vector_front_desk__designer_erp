import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useActivities } from '../../lib/hooks/useActivities'
import { Activity } from '../../types/database'
import { NavSection } from '../../lib/navigation'
import { useAuthStore } from '../../stores/authStore'
import { ActivityList } from '../../components/modules/activities/ActivityList'
import { ActivityForm } from '../../components/modules/activities/ActivityForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

interface Props {
  section: NavSection
  basePath: string
  /** Column used to filter ('type' for digital/physical, 'status' for tasks). */
  field: 'type' | 'status'
}

/** Shared, filter-aware list page for activity sub-modules (Digital, Physical, Tasks). */
export function ActivityListPage({ section, basePath, field }: Props) {
  const { filter } = useParams()
  const { user } = useAuthStore()
  const { activities, createActivity, updateActivity, deleteActivity } = useActivities()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>()

  const activeItem = section.children.find(
    (item) => item.path === `${basePath}${filter ? '/' + filter : ''}`
  )

  const filtered = useMemo(() => {
    const all = activities.data || []
    if (!filter) return all
    return all.filter((a) => (a as any)[field] === filter)
  }, [activities.data, filter, field])

  const handleCreate = () => {
    setEditingActivity(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      await deleteActivity.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Activity>) => {
    if (editingActivity) {
      await updateActivity.mutateAsync({ id: editingActivity.id, data })
    } else {
      await createActivity.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingActivity(undefined)
  }

  if (activities.isLoading) {
    return <div className="text-center py-12">Loading activities...</div>
  }

  if (activities.error) {
    return <div className="text-center py-12 text-red-600">Error loading activities</div>
  }

  return (
    <>
      <ModuleTabs section={section} className="mb-2" />
      <ActivityList
        activities={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : section.label}
        emptyMessage={
          filter ? `No ${activeItem?.label.toLowerCase() || 'matching'} activities` : 'No activities yet'
        }
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingActivity ? 'Edit Activity' : 'Create Activity'}</DialogTitle>
          </DialogHeader>
          <ActivityForm
            activity={editingActivity}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createActivity.isPending || updateActivity.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
