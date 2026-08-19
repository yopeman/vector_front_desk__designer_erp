import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { useCampaignTargets } from '../../lib/hooks/useCampaignTargets'
import { PageSection } from '../../components/shared/PageSection'
import { StatCard } from '../../components/shared/StatCard'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatCurrency } from '../../lib/utils/formatters'
import { Rocket, ListChecks, CircleCheck, Wallet } from 'lucide-react'

const section = navigation.find((s) => s.label === 'Marketing Plan')!

export default function PlanDashboard() {
  const { campaigns } = useCampaigns()
  const { targets } = useCampaignTargets()

  const stats = useMemo(() => {
    const rows = campaigns.data || []
    return {
      total: rows.length,
      active: rows.filter((c) => c.status === 'active').length,
      completed: rows.filter((c) => c.status === 'completed').length,
      budget: rows.reduce((sum, c) => sum + (c.budget_estimated || 0), 0),
      targetCount: (targets.data || []).length,
    }
  }, [campaigns.data, targets.data])

  if (campaigns.isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <PageSection title="Marketing Plan" subtitle="Overview of all marketing campaigns">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Campaigns" value={stats.total} icon={Rocket} />
        <StatCard title="Active" value={stats.active} icon={ListChecks} accent="text-green-600" />
        <StatCard title="Completed" value={stats.completed} icon={CircleCheck} accent="text-gray-600" />
        <StatCard title="Total Budget" value={formatCurrency(stats.budget)} icon={Wallet} accent="text-primary" />
      </div>

      <div className="pt-2">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Campaigns</h2>
        {!stats.total ? (
          <p className="text-gray-500">No campaigns yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(campaigns.data || []).map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <StatusBadge status={campaign.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-gray-500">
                      Budget: <span className="font-medium text-gray-900">{formatCurrency(campaign.budget_estimated)}</span>
                    </span>
                    {campaign.start_date && (
                      <span className="text-gray-500">
                        Start: <span className="font-medium text-gray-900">{new Date(campaign.start_date).toLocaleDateString()}</span>
                      </span>
                    )}
                    {campaign.end_date && (
                      <span className="text-gray-500">
                        End: <span className="font-medium text-gray-900">{new Date(campaign.end_date).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                  {campaign.description && (
                    <p className="mt-2 text-sm text-gray-600">{campaign.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageSection>
  )
}