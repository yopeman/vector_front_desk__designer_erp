import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useExpenses } from '../../lib/hooks/useExpenses'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { formatCurrency } from '../../lib/utils/formatters'
import { FolderKanban, Wallet } from 'lucide-react'

const section = navigation.find((s) => s.label === 'Marketing Costs')!

export default function CampaignCosts() {
  const { expenses } = useExpenses()
  const { campaigns } = useCampaigns()

  const rows = useMemo(() => {
    const campaignsById = new Map((campaigns.data || []).map((c) => [c.id, c.name]))
    const totals = new Map<string, number>()
    const countByCampaign = new Map<string, number>()

    for (const e of expenses.data || []) {
      if (!e.campaign_id) continue
      totals.set(e.campaign_id, (totals.get(e.campaign_id) || 0) + e.amount)
      countByCampaign.set(e.campaign_id, (countByCampaign.get(e.campaign_id) || 0) + 1)
    }

    return Array.from(totals.entries())
      .map(([id, total]) => ({
        id,
        name: campaignsById.get(id) || 'Unknown campaign',
        total,
        count: countByCampaign.get(id) || 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses.data, campaigns.data])

  const grandTotal = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows])

  return (
    <PageSection title="Campaign Costs" subtitle="Expenses grouped by campaign">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Campaigns with Costs" value={rows.length} icon={FolderKanban} />
        <StatCard title="Total Campaign Spend" value={formatCurrency(grandTotal)} icon={Wallet} accent="text-primary" />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No campaign-linked expenses yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden text-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right"># Expenses</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageSection>
  )
}