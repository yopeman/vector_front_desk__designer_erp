import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatCurrency } from '../../lib/utils/formatters'
import { Wallet, FolderKanban, ListChecks } from 'lucide-react'

const section = navigation.find((s) => s.label === 'Marketing Costs')!

export default function BudgetOverview() {
  const { campaigns } = useCampaigns()

  const stats = useMemo(() => {
    const rows = campaigns.data || []
    const active = rows.filter((c) => c.status === 'active')
    const total = rows.reduce((sum, c) => sum + (c.budget_estimated || 0), 0)
    const activeTotal = active.reduce((sum, c) => sum + (c.budget_estimated || 0), 0)
    return { total, activeTotal, count: rows.length, activeCount: active.length }
  }, [campaigns.data])

  if (campaigns.isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <PageSection title="Budget Overview" subtitle="Estimated budgets across all campaigns">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Budget" value={formatCurrency(stats.total)} icon={Wallet} />
        <StatCard title="Active Campaign Budget" value={formatCurrency(stats.activeTotal)} icon={ListChecks} accent="text-green-600" />
        <StatCard title="Campaigns" value={stats.count} icon={FolderKanban} />
      </div>

      {!campaigns.data?.length ? (
        <p className="text-gray-500">No campaigns yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(campaigns.data || []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">{formatCurrency(c.budget_estimated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageSection>
  )
}