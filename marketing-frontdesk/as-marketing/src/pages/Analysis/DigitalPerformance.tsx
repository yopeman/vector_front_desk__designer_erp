import { useMemo } from 'react'
import { useActivities } from '../../lib/hooks/useActivities'
import { AnalysisShell } from './AnalysisShell'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { humanize } from '../../lib/navigation'
import { Monitor } from 'lucide-react'

const digitalTypes = ['content_production', 'social_media', 'website', 'paid_ad']

export default function DigitalPerformanceAnalysis() {
  const { activities } = useActivities()

  const rows = useMemo(() => {
    const source = (activities.data || []).filter((a) => digitalTypes.includes(a.type))
    const byType = new Map<string, { total: number; completed: number; planned: number }>()
    for (const a of source) {
      const cur = byType.get(a.type) || { total: 0, completed: 0, planned: 0 }
      cur.total += 1
      if (a.status === 'completed') cur.completed += 1
      if (a.status === 'planned') cur.planned += 1
      byType.set(a.type, cur)
    }
    return Array.from(byType.entries()).map(([type, v]) => ({ type, ...v }))
  }, [activities.data])

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.total += r.total
          acc.completed += r.completed
          return acc
        },
        { total: 0, completed: 0 }
      ),
    [rows]
  )

  if (activities.isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <AnalysisShell title="Digital Performance" subtitle="Digital marketing activities grouped by type">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Digital Activities" value={totals.total} icon={Monitor} />
        <StatCard title="Completed" value={totals.completed} accent="text-green-600" />
        <StatCard
          title="Completion Rate"
          value={totals.total > 0 ? `${Math.round((totals.completed / totals.total) * 100)}%` : '0%'}
          accent="text-primary"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No digital marketing activities yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.type}>
                  <TableCell className="font-medium capitalize">{humanize(r.type)}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">{r.planned}</TableCell>
                  <TableCell className="text-right text-green-600">{r.completed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AnalysisShell>
  )
}