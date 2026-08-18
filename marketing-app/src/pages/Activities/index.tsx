import { useState } from 'react'
import { useActivities } from '../../lib/hooks/useActivities'
import { Activity } from '../../types/database'
import { ActivityList } from '../../components/modules/activities/ActivityList'
import { ActivityForm } from '../../components/modules/activities/ActivityForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function ActivitiesPage() {
  const { activities, createActivity, updateActivity, deleteActivity } = useActivities()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>()

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
      <ActivityList
        activities={activities.data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Create Activity'}</DialogTitle>
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
