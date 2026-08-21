import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useNotifications } from '../../lib/hooks/useNotifications'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type NotificationType = 
  | 'campaign_created'
  | 'campaign_status_changed'
  | 'activity_assigned'
  | 'activity_due_soon'
  | 'activity_overdue'
  | 'proposal_submitted'
  | 'proposal_accepted'
  | 'proposal_follow_up'
  | 'proforma_requested'
  | 'proforma_submitted'
  | 'proforma_accepted'
  | 'tender_deadline_soon'
  | 'tender_submitted'
  | 'expense_pending_approval'
  | 'message_received'
  | 'task_assigned'

const getNotificationIcon = (_type: NotificationType) => {
  return <Bell className="w-5 h-5" />
}

const getNotificationColor = (type: NotificationType) => {
  const colors: Record<NotificationType, string> = {
    campaign_created: 'bg-blue-50 border-blue-200',
    campaign_status_changed: 'bg-purple-50 border-purple-200',
    activity_assigned: 'bg-green-50 border-green-200',
    activity_due_soon: 'bg-yellow-50 border-yellow-200',
    activity_overdue: 'bg-red-50 border-red-200',
    proposal_submitted: 'bg-blue-50 border-blue-200',
    proposal_accepted: 'bg-green-50 border-green-200',
    proposal_follow_up: 'bg-orange-50 border-orange-200',
    proforma_requested: 'bg-blue-50 border-blue-200',
    proforma_submitted: 'bg-green-50 border-green-200',
    proforma_accepted: 'bg-green-50 border-green-200',
    tender_deadline_soon: 'bg-red-50 border-red-200',
    tender_submitted: 'bg-blue-50 border-blue-200',
    expense_pending_approval: 'bg-orange-50 border-orange-200',
    message_received: 'bg-blue-50 border-blue-200',
    task_assigned: 'bg-green-50 border-green-200'
  }
  return colors[type] || 'bg-gray-50 border-gray-200'
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const { notifications, markAsRead, markAllAsRead, deleteNotification, deleteAll } = useNotifications(user?.id)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.data?.filter((n: any) => !n.is_read).length || 0

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      await deleteNotification.mutateAsync(id)
    }
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      await deleteAll.mutateAsync()
    }
  }

  const allNotifications = notifications.data || []
  const notificationsCount = allNotifications.length

  const filteredNotifications = filter === 'unread' 
    ? allNotifications.filter((n: any) => !n.is_read) || []
    : allNotifications || []

  if (notifications.isLoading) {
    return <div className="text-center py-12">Loading notifications...</div>
  }

  if (notifications.error) {
    return <div className="text-center py-12 text-red-600">Error loading notifications</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          {notificationsCount > 0 && (
            <Button variant="outline" onClick={handleClearAll} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({notificationsCount})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={`transition-all ${!notification.is_read ? 'border-l-4 border-l-primary' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h3>
                        {notification.message && (
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
