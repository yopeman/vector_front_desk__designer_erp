import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Target, 
  Rocket, 
  Monitor, 
  Handshake, 
  CheckSquare, 
  FileText, 
  FileSpreadsheet, 
  Landmark, 
  Package, 
  Search, 
  Wallet, 
  BarChart3, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { navigation } from '../lib/navigation'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const kpiData = [
  { label: 'Active Campaigns', value: 12, change: 8, icon: Rocket, trend: 'up' },
  { label: 'Pending Tasks', value: 24, change: -3, icon: CheckSquare, trend: 'down' },
  { label: 'Proposals Sent', value: 18, change: 15, icon: FileText, trend: 'up' },
  { label: 'Budget Used', value: '$45.2K', change: 12, icon: Wallet, trend: 'up' },
  { label: 'Conversion Rate', value: '23.5%', change: 5, icon: BarChart3, trend: 'up' },
  { label: 'Leads Generated', value: 156, change: 22, icon: Users, trend: 'up' },
]

const monthlyData = [
  { month: 'Jan', campaigns: 4, leads: 45, conversions: 8 },
  { month: 'Feb', campaigns: 6, leads: 52, conversions: 12 },
  { month: 'Mar', campaigns: 8, leads: 68, conversions: 15 },
  { month: 'Apr', campaigns: 10, leads: 75, conversions: 18 },
  { month: 'May', campaigns: 12, leads: 92, conversions: 22 },
  { month: 'Jun', campaigns: 14, leads: 110, conversions: 28 },
]

const campaignStatusData = [
  { name: 'Planned', value: 8 },
  { name: 'Active', value: 12 },
  { name: 'Completed', value: 15 },
  { name: 'On Hold', value: 3 },
  { name: 'Archived', value: 5 },
]

const budgetData = [
  { category: 'Digital Ads', budget: 15000, spent: 12000 },
  { category: 'Events', budget: 20000, spent: 18000 },
  { category: 'Content', budget: 8000, spent: 6500 },
  { category: 'Physical', budget: 12000, spent: 9000 },
  { category: 'Tools', budget: 5000, spent: 4200 },
]

export default function Home() {
  const navigate = useNavigate()

  const handleQuickLink = (path: string) => {
    navigate(path)
  }

  return (
    <div className="space-y-6 p-6 bg-gray-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your marketing performance and activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.label}</p>
              </div>
              <div className="mt-2 text-xs">
                <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Performance Trend</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#637381" fontSize={12} />
              <YAxis stroke="#637381" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px' 
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Leads"
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Conversions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Status Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Status</h2>
            <Rocket className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campaignStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {campaignStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Budget vs Actual Spend</h2>
          <DollarSign className="w-5 h-5 text-gray-400" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={budgetData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" stroke="#637381" fontSize={12} />
            <YAxis stroke="#637381" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px' 
              }}
            />
            <Legend />
            <Bar dataKey="budget" fill="#8884d8" name="Budget" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" fill="#82ca9d" name="Spent" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {navigation.map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.label}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                onClick={() => handleQuickLink(section.children[0].path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">{section.label}</h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.children.slice(0, 3).map((item) => (
                    <span
                      key={item.path}
                      className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md"
                    >
                      {item.label}
                    </span>
                  ))}
                  {section.children.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md">
                      +{section.children.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
