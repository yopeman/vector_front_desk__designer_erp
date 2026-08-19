import { Activity } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { StatusBadge } from '../../shared/StatusBadge'
import { Button } from '../../ui/button'

interface ActivityListProps {
  activities: Activity[]
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
  onCreate: () => void
  title?: string
  createLabel?: string
  emptyMessage?: string
}

export function ActivityList({
  activities,
  onEdit,
  onDelete,
  onCreate,
  title = 'Activities',
  createLabel = 'Create Activity',
  emptyMessage = 'No activities yet',
}: ActivityListProps) {
  if (activities.length === 0) {
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
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{activity.title}</CardTitle>
                <StatusBadge status={activity.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                </div>
                {activity.scheduled_start && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start:</span>
                    <span>{new Date(activity.scheduled_start).toLocaleString()}</span>
                  </div>
                )}
                {activity.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span>{activity.location}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(activity)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(activity.id)}>
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
