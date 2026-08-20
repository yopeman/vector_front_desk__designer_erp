import { Outlet, Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Settings, X, House } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthStore } from '../../stores/authStore'
import { useState, useEffect } from 'react'
import { navigation, settingsNav, frontDeskNav, findSectionForPath } from '../../lib/navigation'
import { cn } from '../../lib/utils/cn'

export default function DashboardLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeSection = findSectionForPath(location.pathname)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(activeSection ? [activeSection.label] : [])
  )

  // Keep the active section expanded as the user navigates.
  useEffect(() => {
    if (activeSection) {
      setExpanded((prev) => {
        const next = new Set(prev)
        next.add(activeSection.label)
        return next
      })
    }
  }, [activeSection?.label]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
  }

  const isSettingsActive = location.pathname === settingsNav.path

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-bold text-primary">Marketing ERP</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((section) => {
            const isExpanded = expanded.has(section.label)
            const isSectionActive = activeSection?.label === section.label
            return (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors',
                    isSectionActive ? 'text-primary' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="flex items-center">
                    <section.icon className="w-5 h-5 mr-3" />
                    {section.label}
                  </span>
                  <ChevronDown
                    className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-1 space-y-0.5 pl-4">
                    {section.children.map((item) => {
                      const isActive = location.pathname === item.path
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm rounded-lg transition-colors',
                            isActive
                              ? 'bg-primary text-white font-medium'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Frontdesk */}
          <div className="pt-1 border-t border-gray-100 mt-2">
            <Link
              to={frontDeskNav.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isSettingsActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <frontDeskNav.icon className="w-5 h-5 mr-3" />
              {frontDeskNav.label}
            </Link>
          </div>
          
          {/* Settings */}
          <div className="pt-1 border-t border-gray-100 mt-2">
            <Link
              to={settingsNav.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isSettingsActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <settingsNav.icon className="w-5 h-5 mr-3" />
              {settingsNav.label}
            </Link>
          </div>
        </nav>

        {/* User info */}
        <div className="px-6 py-4 border-t border-gray-200 shrink-0">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-gray-900">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1" />
        </div>

        {/* Page content */}
        <main className="px-4 py-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

