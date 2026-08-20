import { useMemo } from 'react'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { useExpenses } from '../../lib/hooks/useExpenses'
import { useProposals } from '../../lib/hooks/useProposals'
import { AnalysisShell } from './AnalysisShell'
import { StatCard } from '../../components/shared/StatCard'
import { formatCurrency } from '../../lib/utils/formatters'
import { Wallet, Receipt, DollarSign, TrendingUp } from 'lucide-react'

export default function CostsRoi() {
  const { campaigns } = useCampaigns()
  const { expenses } = useExpenses()
  const { proposals } = useProposals()

  const metrics = useMemo(() => {
    const budget = (campaigns.data || []).reduce((sum, c) => sum + (c.budget_estimated || 0), 0)
    const cost = (expenses.data || []).reduce((sum, e) => sum + e.amount, 0)
    const revenue = (proposals.data || [])
      .filter((p) => p.status === 'accepted')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0
    return { budget, cost, revenue, roi }
  }, [campaigns.data, expenses.data, proposals.data])

  if (campaigns.isLoading || expenses.isLoading || proposals.isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <AnalysisShell title="Costs & ROI" subtitle="Marketing spend and return on investment">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Budget" value={formatCurrency(metrics.budget)} icon={Wallet} />
        <StatCard title="Total Cost (Expenses)" value={formatCurrency(metrics.cost)} icon={Receipt} accent="text-primary" />
        <StatCard title="Accepted Revenue" value={formatCurrency(metrics.revenue)} icon={DollarSign} accent="text-green-600" />
        <StatCard
          title="ROI"
          value={`${metrics.roi.toFixed(1)}%`}
          icon={TrendingUp}
          accent={metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      <p className="text-sm text-gray-500">
        ROI = (Accepted Revenue − Total Cost) ÷ Total Cost × 100. Revenue is based on accepted proposals.
      </p>
    </AnalysisShell>
  )
}