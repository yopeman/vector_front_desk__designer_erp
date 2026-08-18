import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { useCampaignTargets } from '../../lib/hooks/useCampaignTargets'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { humanize } from '../../lib/navigation'
import { MousePointerClick, Eye, TrendingUp } from 'lucide-react'

const section = navigation.find((s) => s.label === 'Digital Marketing')!
const digitalMetrics = ['impressions', 'engagement', 'conversions', 'clicks', 'leads', 'traffic']

export default function DigitalPerformance() {
  const { campaigns } = useCampaigns()
  const { targets } = useCampaignTargets()

  const rows = useMemo(() => {
    const campaignsById = new Map((campaigns.data || []).map((c) => [c.id, c]))
    return (targets.data || [])
      .filter((t) => digitalMetrics.includes(t.metric))
      .map((t) => ({
        id: t.id,
        campaign: campaignsById.get(t.campaign_id)?.name || 'Unknown campaign',
        metric: t.metric,
        target: t.target_value ?? 0,
        actual: t.actual_value,
      }))
  }, [campaigns.data, targets.data])

  const totals = useMemo(() => {
    let target = 0
    let actual = 0
    for (const r of rows) {
      target += r.target
      actual += r.actual
    }
    return { target, actual }
  }, [rows])

  if (campaigns.isLoading || targets.isLoading) {
    return <div className="text-center py-12">Loading performance...</div>
  }

  return (
    <PageSection title="Digital Performance" subtitle="Clicks, conversions and engagement tracked via campaign targets">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Impressions Target" value={totals.target.toLocaleString()} icon={Eye} />
        <StatCard title="Actual Results" value={totals.actual.toLocaleString()} icon={MousePointerClick} accent="text-green-600" />
        <StatCard title="Digital Metrics Tracked" value={rows.length} icon={TrendingUp} />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No digital performance targets yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const progress = row.target > 0 ? Math.round((row.actual / row.target) * 100) : 0
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.campaign}</TableCell>
                    <TableCell className="capitalize">{humanize(row.metric)}</TableCell>
                    <TableCell className="text-right">{row.target.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.actual.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={progress >= 100 ? 'text-green-600' : 'text-gray-600'}>{progress}%</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageSection>
  )
}