import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { useCampaignTargets } from '../../lib/hooks/useCampaignTargets'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { humanize } from '../../lib/navigation'
import { Target } from 'lucide-react'

const section = navigation.find((s) => s.label === 'Marketing Plan')!

export default function PlanTargets() {
  const { campaigns } = useCampaigns()
  const { targets } = useCampaignTargets()

  const rows = useMemo(() => {
    const campaignsById = new Map((campaigns.data || []).map((c) => [c.id, c]))
    const targetRows = (targets.data || []).map((t) => {
      const campaign = campaignsById.get(t.campaign_id)
      return {
        id: t.id,
        campaign: campaign?.name || 'Unknown campaign',
        metric: t.metric,
        target: t.target_value ?? 0,
        actual: t.actual_value,
      }
    })
    targetRows.sort((a, b) => a.campaign.localeCompare(b.campaign))
    return targetRows
  }, [campaigns.data, targets.data])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.target += r.target
        acc.actual += r.actual
        return acc
      },
      { target: 0, actual: 0 }
    )
  }, [rows])

  if (campaigns.isLoading || targets.isLoading) {
    return <div className="text-center py-12">Loading targets...</div>
  }

  return (
    <PageSection title="Targets" subtitle="Quantitative goals vs actuals by campaign">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Targets" value={rows.length} icon={Target} />
        <StatCard title="Target Value" value={totals.target.toLocaleString()} />
        <StatCard title="Actual Value" value={totals.actual.toLocaleString()} accent="text-green-600" />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No campaign targets yet.</p>
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