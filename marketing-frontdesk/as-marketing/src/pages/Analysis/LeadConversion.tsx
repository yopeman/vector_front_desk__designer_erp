import { useMemo } from 'react'
import { useProposals } from '../../lib/hooks/useProposals'
import { useTenders } from '../../lib/hooks/useTenders'
import { AnalysisShell } from './AnalysisShell'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { FileText, Landmark, TrendingUp } from 'lucide-react'

export default function LeadConversion() {
  const { proposals } = useProposals()
  const { tenders } = useTenders()

  const stats = useMemo(() => {
    const p = proposals.data || []
    const t = tenders.data || []
    const acceptedP = p.filter((x) => x.status === 'accepted').length
    const awardedT = t.filter((x) => x.status === 'awarded').length
    return {
      proposals: p.length,
      acceptedP,
      proposalWinRate: p.length > 0 ? Math.round((acceptedP / p.length) * 100) : 0,
      tenders: t.length,
      awardedT,
      tenderWinRate: t.length > 0 ? Math.round((awardedT / t.length) * 100) : 0,
      totalPipeline: p.length + t.length,
    }
  }, [proposals.data, tenders.data])

  if (proposals.isLoading || tenders.isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <AnalysisShell title="Lead & Conversion" subtitle="Win rates calculated from proposals and tenders">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Proposals" value={stats.proposals} icon={FileText} />
        <StatCard title="Proposal Win Rate" value={`${stats.proposalWinRate}%`} accent="text-green-600" />
        <StatCard title="Tender Win Rate" value={`${stats.tenderWinRate}%`} icon={Landmark} accent="text-primary" />
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Won</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Proposals</TableCell>
              <TableCell className="text-right">{stats.proposals}</TableCell>
              <TableCell className="text-right text-green-600">{stats.acceptedP}</TableCell>
              <TableCell className="text-right">{stats.proposalWinRate}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tenders</TableCell>
              <TableCell className="text-right">{stats.tenders}</TableCell>
              <TableCell className="text-right text-green-600">{stats.awardedT}</TableCell>
              <TableCell className="text-right">{stats.tenderWinRate}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Combined Pipeline</TableCell>
              <TableCell className="text-right">{stats.totalPipeline}</TableCell>
              <TableCell className="text-right text-green-600">{stats.acceptedP + stats.awardedT}</TableCell>
              <TableCell className="text-right">
                {stats.totalPipeline > 0 ? Math.round(((stats.acceptedP + stats.awardedT) / stats.totalPipeline) * 100) : 0}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p className="flex items-center gap-2 text-sm text-gray-500">
        <TrendingUp className="h-4 w-4" /> Win rate = won / total for each channel.
      </p>
    </AnalysisShell>
  )
}