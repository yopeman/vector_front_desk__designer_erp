import { useMemo } from 'react'
import { useProposals } from '../../lib/hooks/useProposals'
import { AnalysisShell } from './AnalysisShell'
import { StatCard } from '../../components/shared/StatCard'
import { humanize } from '../../lib/navigation'
import { Filter } from 'lucide-react'

const funnelOrder = ['draft', 'submitted', 'follow_up', 'accepted', 'rejected']

export default function ProposalFunnel() {
  const { proposals } = useProposals()

  const rows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of proposals.data || []) {
      counts.set(p.status, (counts.get(p.status) || 0) + 1)
    }
    return funnelOrder
      .filter((s) => (counts.get(s) || 0) > 0)
      .map((status) => ({ status, count: counts.get(status) || 0 }))
  }, [proposals.data])

  const max = useMemo(() => (rows.length ? Math.max(...rows.map((r) => r.count)) : 1), [rows])

  if (proposals.isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <AnalysisShell title="Proposal Funnel" subtitle="Proposals grouped by current status">
      <StatCard title="Total Proposals" value={proposals.data?.length || 0} icon={Filter} />

      {rows.length === 0 ? (
        <p className="text-gray-500">No proposals yet.</p>
      ) : (
        <div className="space-y-3 rounded-lg border bg-white p-6 shadow-sm">
          {rows.map((r) => (
            <div key={r.status}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize font-medium text-gray-700">{humanize(r.status)}</span>
                <span className="text-gray-500">{r.count}</span>
              </div>
              <div className="h-4 w-full rounded bg-gray-100">
                <div
                  className="h-4 rounded bg-primary"
                  style={{ width: `${Math.max((r.count / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AnalysisShell>
  )
}