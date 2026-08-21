import { useState, useEffect } from 'react'
import { Bell, MessageSquare, User, LogOut, Settings, Search, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthStore } from '../../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'
import { useNotifications } from '../../lib/hooks/useNotifications'
import { useConversations } from '../../lib/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent } from '../ui/dialog'
import { Input } from '../ui/input'
import { navigation, homeNav, settingsNav } from '../../lib/navigation'

export default function TopBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState<'notification' | 'message' | 'profile' | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const { unreadNotifications, markAsRead } = useNotifications(user?.id)
  const { conversations } = useConversations(user?.id)

  // Flatten all navigation items for search
  const allNavItems = [
    { label: homeNav.label, path: homeNav.path, section: 'Home' },
    { label: settingsNav.label, path: settingsNav.path, section: 'Settings' },
    ...navigation.flatMap(section =>
      section.children.map(item => ({
        label: item.label,
        path: item.path,
        section: section.label
      }))
    )
  ]

  const filteredItems = allNavItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.section.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
        setSelectedIndex(0)
        setSearchQuery('')
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
      if (searchOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % filteredItems.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
        } else if (e.key === 'Enter' && filteredItems.length > 0) {
          e.preventDefault()
          navigate(filteredItems[selectedIndex].path)
          setSearchOpen(false)
          setSearchQuery('')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, filteredItems, selectedIndex, navigate])

  const handleSearchSelect = (path: string) => {
    navigate(path)
    setSearchOpen(false)
    setSearchQuery('')
  }

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
        {/* Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm text-gray-600 w-48 sm:w-64"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-500 ml-auto">
            <span>⌘</span>K
          </kbd>
        </button>

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

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg p-0">
          <div className="flex items-center border-b px-3">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              className="border-0 focus-visible:ring-0 shadow-none"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No results found</div>
            ) : (
              filteredItems.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => handleSearchSelect(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.section}</div>
                  </div>
                  {index === selectedIndex && <ArrowRight className="w-4 h-4 text-gray-400" />}
                </button>
              ))
            )}
          </div>
          <div className="border-t p-2 text-xs text-gray-500 flex justify-between">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
