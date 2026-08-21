import { useState } from 'react'
import { Bell, MessageSquare, User, LogOut, Settings } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthStore } from '../../stores/authStore'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../lib/hooks/useNotifications'
import { useConversations } from '../../lib/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'

export default function TopBar() {
  const { user, logout } = useAuthStore()
  const [activeModal, setActiveModal] = useState<'notification' | 'message' | 'profile' | null>(null)
  
  const { unreadNotifications, markAsRead } = useNotifications(user?.id)
  const { conversations } = useConversations(user?.id)

  const handleLogout = async () => {
    await logout()
    setActiveModal(null)
  }

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Notification Icon */}
        <button
          onClick={() => setActiveModal(activeModal === 'notification' ? null : 'notification')}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadNotifications.data && unreadNotifications.data.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Message Icon */}
        <button
          onClick={() => setActiveModal(activeModal === 'message' ? null : 'message')}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-gray-600" />
          {conversations.data && conversations.data.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Profile Icon */}
        <button
          onClick={() => setActiveModal(activeModal === 'profile' ? null : 'profile')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <User className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Notification Modal */}
      {activeModal === 'notification' && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {unreadNotifications.isLoading ? (
              <div className="text-center text-gray-500 text-sm">Loading notifications...</div>
            ) : unreadNotifications.data && unreadNotifications.data.length > 0 ? (
              unreadNotifications.data.slice(0, 5).map((notification: any) => (
                <div
                  key={notification.id}
                  className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <p className="text-sm text-gray-900">{notification.title}</p>
                  {notification.message && (
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm">No new notifications</div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 text-gray-800">
            <Link to="/notifications" onClick={() => setActiveModal(null)}>
              <Button variant="outline" size="sm" className="w-full">
                View All Notifications
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {activeModal === 'message' && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Messages</h3>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {conversations.isLoading ? (
              <div className="text-center text-gray-500 text-sm">Loading conversations...</div>
            ) : conversations.data && conversations.data.length > 0 ? (
              conversations.data.slice(0, 5).map((conversation: any) => (
                <div
                  key={conversation.id}
                  className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    setActiveModal(null)
                    window.location.href = `/messages`
                  }}
                >
                  <p className="text-sm font-medium text-gray-900">{conversation.name || 'Conversation'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm">No conversations yet</div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 text-gray-800">
            <Link to="/messages" onClick={() => setActiveModal(null)}>
              <Button variant="outline" size="sm" className="w-full">
                View All Messages
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link to="/settings" onClick={() => setActiveModal(null)}>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {activeModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}
