import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase/client'
import { 
  Rocket, 
  CheckSquare, 
  FileText, 
  Wallet, 
  BarChart3, 
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

export default function Home() {
  const navigate = useNavigate()
  const [kpiData, setKpiData] = useState([
    { label: 'Active Campaigns', value: 0, change: 0, icon: Rocket, trend: 'up' },
    { label: 'Pending Tasks', value: 0, change: 0, icon: CheckSquare, trend: 'down' },
    { label: 'Proposals Sent', value: 0, change: 0, icon: FileText, trend: 'up' },
    { label: 'Budget Used', value: '$0', change: 0, icon: Wallet, trend: 'up' },
    { label: 'Conversion Rate', value: '0%', change: 0, icon: BarChart3, trend: 'up' },
    { label: 'Leads Generated', value: 0, change: 0, icon: Users, trend: 'up' },
  ])
  const [monthlyData, setMonthlyData] = useState([
    { month: 'Jan', campaigns: 0, leads: 0, conversions: 0 },
    { month: 'Feb', campaigns: 0, leads: 0, conversions: 0 },
    { month: 'Mar', campaigns: 0, leads: 0, conversions: 0 },
    { month: 'Apr', campaigns: 0, leads: 0, conversions: 0 },
    { month: 'May', campaigns: 0, leads: 0, conversions: 0 },
    { month: 'Jun', campaigns: 0, leads: 0, conversions: 0 },
  ])
  const [campaignStatusData, setCampaignStatusData] = useState([
    { name: 'Planned', value: 0 },
    { name: 'Active', value: 0 },
    { name: 'Completed', value: 0 },
    { name: 'On Hold', value: 0 },
    { name: 'Archived', value: 0 },
  ])
  const [budgetData, setBudgetData] = useState([
    { category: 'Advertising', budget: 0, spent: 0 },
    { category: 'Content', budget: 0, spent: 0 },
    { category: 'Events', budget: 0, spent: 0 },
    { category: 'Travel', budget: 0, spent: 0 },
    { category: 'Software', budget: 0, spent: 0 },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch KPI data - include created_at for month-over-month calculations
      const [campaignsRes, activitiesRes, proposalsRes, expensesRes, targetsRes] = await Promise.all([
        supabase.from('mrkt_campaigns').select('*').eq('status', 'active'),
        supabase.from('mrkt_activities').select('*').in('status', ['planned', 'in_progress']),
        supabase.from('mrkt_proposals').select('*').eq('status', 'submitted'),
        supabase.from('mrkt_expenses').select('*'),
        supabase.from('mrkt_campaign_targets').select('*'),
      ])

      const activeCampaigns = campaignsRes.data?.length || 0
      const pendingTasks = activitiesRes.data?.length || 0
      const proposalsSent = proposalsRes.data?.length || 0
      const totalBudgetUsed = expensesRes.data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0
      
      // Calculate leads generated
      const leadsTargets = targetsRes.data?.filter(t => t.metric === 'leads') || []
      const leadsGenerated = leadsTargets.reduce((sum, t) => sum + (t.actual_value || 0), 0)
      
      // Calculate conversion rate
      const conversionTargets = targetsRes.data?.filter(t => t.metric === 'conversions') || []
      const totalTargetConversions = conversionTargets.reduce((sum, t) => sum + (t.target_value || 0), 0)
      const actualConversions = conversionTargets.reduce((sum, t) => sum + (t.actual_value || 0), 0)
      const conversionRate = totalTargetConversions > 0 ? ((actualConversions / totalTargetConversions) * 100).toFixed(1) : '0'

      // Calculate month-over-month changes
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

      // Helper to get count for a specific month
      const getCountForMonth = (items: any[], dateField: string) => {
        return items?.filter(item => {
          const date = new Date(item[dateField])
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear
        }).length || 0
      }

      const getCountForLastMonth = (items: any[], dateField: string) => {
        return items?.filter(item => {
          const date = new Date(item[dateField])
          return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
        }).length || 0
      }

      // Calculate change percentage
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
      }

      // Fetch all data for month-over-month comparison
      const [allCampaignsData, allActivitiesData, allProposalsData] = await Promise.all([
        supabase.from('mrkt_campaigns').select('*'),
        supabase.from('mrkt_activities').select('*'),
        supabase.from('mrkt_proposals').select('*'),
      ])

      const currentMonthCampaigns = getCountForMonth(allCampaignsData.data || [], 'created_at')
      const lastMonthCampaigns = getCountForLastMonth(allCampaignsData.data || [], 'created_at')
      const campaignsChange = calculateChange(currentMonthCampaigns, lastMonthCampaigns)

      const currentMonthTasks = getCountForMonth(allActivitiesData.data || [], 'created_at')
      const lastMonthTasks = getCountForLastMonth(allActivitiesData.data || [], 'created_at')
      const tasksChange = calculateChange(currentMonthTasks, lastMonthTasks)

      const currentMonthProposals = getCountForMonth(allProposalsData.data || [], 'created_at')
      const lastMonthProposals = getCountForLastMonth(allProposalsData.data || [], 'created_at')
      const proposalsChange = calculateChange(currentMonthProposals, lastMonthProposals)

      const currentMonthExpenses = expensesRes.data?.filter(exp => {
        const date = new Date(exp.expense_date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0

      const lastMonthExpenses = expensesRes.data?.filter(exp => {
        const date = new Date(exp.expense_date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      }).reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0

      const budgetChange = calculateChange(currentMonthExpenses, lastMonthExpenses)

      const currentMonthLeads = leadsTargets.filter(t => {
        const date = new Date(t.target_date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).reduce((sum, t) => sum + (t.actual_value || 0), 0)

      const lastMonthLeads = leadsTargets.filter(t => {
        const date = new Date(t.target_date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      }).reduce((sum, t) => sum + (t.actual_value || 0), 0)

      const leadsChange = calculateChange(currentMonthLeads, lastMonthLeads)

      const currentMonthConversions = conversionTargets.filter(t => {
        const date = new Date(t.target_date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).reduce((sum, t) => sum + (t.actual_value || 0), 0)

      const lastMonthConversions = conversionTargets.filter(t => {
        const date = new Date(t.target_date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      }).reduce((sum, t) => sum + (t.actual_value || 0), 0)

      const conversionChange = calculateChange(currentMonthConversions, lastMonthConversions)

      setKpiData([
        { label: 'Active Campaigns', value: activeCampaigns, change: Math.round(campaignsChange), icon: Rocket, trend: campaignsChange >= 0 ? 'up' : 'down' },
        { label: 'Pending Tasks', value: pendingTasks, change: Math.round(tasksChange), icon: CheckSquare, trend: tasksChange >= 0 ? 'up' : 'down' },
        { label: 'Proposals Sent', value: proposalsSent, change: Math.round(proposalsChange), icon: FileText, trend: proposalsChange >= 0 ? 'up' : 'down' },
        { label: 'Budget Used', value: `$${(totalBudgetUsed / 1000).toFixed(1)}K`, change: Math.round(budgetChange), icon: Wallet, trend: budgetChange >= 0 ? 'up' : 'down' },
        { label: 'Conversion Rate', value: `${conversionRate}%`, change: Math.round(conversionChange), icon: BarChart3, trend: conversionChange >= 0 ? 'up' : 'down' },
        { label: 'Leads Generated', value: leadsGenerated, change: Math.round(leadsChange), icon: Users, trend: leadsChange >= 0 ? 'up' : 'down' },
      ])

      // Fetch campaign status data - use already fetched data
      const statusCounts = {
        planned: 0,
        active: 0,
        completed: 0,
        on_hold: 0,
        archived: 0,
      }
      allCampaignsData.data?.forEach((c: any) => {
        if (statusCounts.hasOwnProperty(c.status)) {
          statusCounts[c.status as keyof typeof statusCounts]++
        }
      })
      setCampaignStatusData([
        { name: 'Planned', value: statusCounts.planned },
        { name: 'Active', value: statusCounts.active },
        { name: 'Completed', value: statusCounts.completed },
        { name: 'On Hold', value: statusCounts.on_hold },
        { name: 'Archived', value: statusCounts.archived },
      ])

      // Fetch budget data by category - only showing actual spend (no budget comparison as schema doesn't have category-level budgets)
      const { data: allExpenses } = await supabase.from('mrkt_expenses').select('category, amount')
      const categorySpend = {
        advertising: 0,
        content: 0,
        events: 0,
        travel: 0,
        software: 0,
      }
      allExpenses?.forEach(exp => {
        if (categorySpend.hasOwnProperty(exp.category)) {
          categorySpend[exp.category as keyof typeof categorySpend] += (exp.amount || 0)
        }
      })
      setBudgetData([
        { category: 'Advertising', budget: categorySpend.advertising, spent: categorySpend.advertising },
        { category: 'Content', budget: categorySpend.content, spent: categorySpend.content },
        { category: 'Events', budget: categorySpend.events, spent: categorySpend.events },
        { category: 'Travel', budget: categorySpend.travel, spent: categorySpend.travel },
        { category: 'Software', budget: categorySpend.software, spent: categorySpend.software },
      ])

      // Fetch monthly data - campaigns by start_date, leads and conversions from targets by target_date
      const campaignsByMonth = await supabase.from('mrkt_campaigns').select('start_date')
      const targetsByMonth = await supabase.from('mrkt_campaign_targets').select('*')
      
      const monthData = [
        { month: 'Jan', campaigns: 0, leads: 0, conversions: 0 },
        { month: 'Feb', campaigns: 0, leads: 0, conversions: 0 },
        { month: 'Mar', campaigns: 0, leads: 0, conversions: 0 },
        { month: 'Apr', campaigns: 0, leads: 0, conversions: 0 },
        { month: 'May', campaigns: 0, leads: 0, conversions: 0 },
        { month: 'Jun', campaigns: 0, leads: 0, conversions: 0 },
      ]
      
      // Count campaigns by month
      campaignsByMonth.data?.forEach((c: any) => {
        if (c.start_date) {
          const month = new Date(c.start_date).getMonth()
          if (month >= 0 && month < 6) {
            monthData[month].campaigns++
          }
        }
      })
      
      // Aggregate leads and conversions by month from targets
      targetsByMonth.data?.forEach((t: any) => {
        if (t.target_date) {
          const month = new Date(t.target_date).getMonth()
          if (month >= 0 && month < 6) {
            if (t.metric === 'leads') {
              monthData[month].leads += (t.actual_value || 0)
            } else if (t.metric === 'conversions') {
              monthData[month].conversions += (t.actual_value || 0)
            }
          }
        }
      })
      
      setMonthlyData(monthData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLink = (path: string) => {
    navigate(path)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="">
      {/* Header */}
      {/* <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your marketing performance and activities</p>
      </div> */}

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
                {campaignStatusData.map((_, index) => (
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
