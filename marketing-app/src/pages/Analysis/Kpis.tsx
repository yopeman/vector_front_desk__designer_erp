import { useMemo } from 'react'
import { useCampaignTargets } from '../../lib/hooks/useCampaignTargets'
import { AnalysisShell } from './AnalysisShell'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { humanize } from '../../lib/navigation'
import { Target, CircleCheck, Gauge } from 'lucide-react'

export default function Kpis() {
  const { targets } = useCampaignTargets()

  const rows = useMemo(() => {
    const agg = new Map<string, { target: number; actual: number; count: number }>()
    for (const t of targets.data || []) {
      const key = t.metric
      const cur = agg.get(key) || { target: 0, actual: 0, count: 0 }
      cur.target += t.target_value ?? 0
      cur.actual += t.actual_value
      cur.count += 1
      agg.set(key, cur)
    }
    return Array.from(agg.entries()).map(([metric, v]) => ({
      metric,
      target: v.target,
      actual: v.actual,
      count: v.count,
      progress: v.target > 0 ? Math.round((v.actual / v.target) * 100) : 0,
    }))
  }, [targets.data])

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.target += r.target
          acc.actual += r.actual
          return acc
        },
        { target: 0, actual: 0 }
      ),
    [rows]
  )

  if (targets.isLoading) return <div className="text-center py-12">Loading KPIs...</div>

  return (
    <AnalysisShell title="KPIs" subtitle="Target vs actual across all marketing metrics">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Metrics Tracked" value={rows.length} icon={Target} />
        <StatCard title="Combined Target" value={totals.target.toLocaleString()} icon={Gauge} />
        <StatCard title="Combined Actual" value={totals.actual.toLocaleString()} icon={CircleCheck} accent="text-green-600" />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No campaign targets yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden text-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.metric}>
                  <TableCell className="font-medium capitalize">{humanize(r.metric)}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right">{r.target.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{r.actual.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={r.progress >= 100 ? 'text-green-600' : 'text-gray-600'}>{r.progress}%</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AnalysisShell>
  )
}