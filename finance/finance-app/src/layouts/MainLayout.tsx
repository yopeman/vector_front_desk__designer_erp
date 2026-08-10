import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  DollarSign, 
  BookOpen, 
  Package, 
  FileText, 
  Users, 
  BarChart3,
  Menu,
  X,
  MessageSquare,
  Bell,
  StickyNote,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import TopHeader from '../components/TopHeader';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/purchases', label: 'Purchase', icon: ShoppingCart },
  { path: '/sales', label: 'Sales', icon: DollarSign },
  { path: '/chart-of-accounts', label: 'Chart of Accounts', icon: BookOpen },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/general-journal', label: 'General Journal', icon: FileText },
  { path: '/payroll', label: 'Payroll', icon: Users },
  { path: '/reports', label: 'Report', icon: BarChart3 },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 mt-[62px] lg:mt-0
          w-64 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        style={{ backgroundColor: '#00CED1' }}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-white">V☰CTOR</h1>
              <p className="text-sm text-white">Advert & Manufacturing ERP</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-white text-[#00CED1]' 
                        : 'text-white hover:bg-white hover:text-[#00CED1]'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <>
            {/* Top Header */}
            <TopHeader 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onNavigate={handleNavigate}
            />
            <div className="p-6 lg:p-8">
              {children}
            </div>
          </>
        </main>
      </div>
    </div>
  );
}
