import { useMemo } from 'react'
import { useExpenses } from '../../../lib/hooks/useExpenses'
import { useCampaigns } from '../../../lib/hooks/useCampaigns'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { formatCurrency } from '../../../lib/utils/formatters'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const CATEGORY_COLORS: Record<string, string> = {
  advertising: '#00CED1',
  content: '#00A8A7',
  events: '#66DEE0',
  travel: '#00827D',
  software: '#33D3D6',
  personnel: '#005C53',
  other: '#99E9EB',
}

export function BudgetDashboard() {
  const { expenses } = useExpenses()
  const { campaigns } = useCampaigns()

  const approved = (expenses.data || []).filter((e) => e.approval_status === 'approved')

  const budgetData = useMemo(() => {
    const rows = (campaigns.data || []).map((campaign) => {
      const spent = approved
        .filter((e) => e.campaign_id === campaign.id)
        .reduce((sum, e) => sum + Number(e.amount), 0)
      return {
        name: campaign.name,
        budget: Number(campaign.budget_estimated || 0),
        spent,
      }
    })
    // Expenses not linked to a campaign
    const uncategorized = approved
      .filter((e) => !e.campaign_id)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    if (uncategorized > 0) {
      rows.push({ name: 'Uncategorized', budget: 0, spent: uncategorized })
    }
    return rows
  }, [approved, campaigns.data])

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    approved.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [approved])

  const totalBudget = budgetData.reduce((sum, r) => sum + r.budget, 0)
  const totalSpent = approved.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalPending = (expenses.data || [])
    .filter((e) => e.approval_status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Approved Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetData.length === 0 ? (
              <p className="text-sm text-gray-500">No budget data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={budgetData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="budget" fill="#66DEE0" name="Budget" />
                  <Bar dataKey="spent" fill="#00CED1" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-gray-500">No approved expenses yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#99E9EB'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
