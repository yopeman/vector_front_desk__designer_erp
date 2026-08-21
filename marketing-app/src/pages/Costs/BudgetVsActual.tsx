import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useExpenses } from '../../lib/hooks/useExpenses'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { formatCurrency } from '../../lib/utils/formatters'

const section = navigation.find((s) => s.label === 'Marketing Costs')!

export default function BudgetVsActual() {
  const { expenses } = useExpenses()
  const { campaigns } = useCampaigns()

  const rows = useMemo(() => {
    const spendByCampaign = new Map<string, number>()
    for (const e of expenses.data || []) {
      if (!e.campaign_id) continue
      spendByCampaign.set(e.campaign_id, (spendByCampaign.get(e.campaign_id) || 0) + e.amount)
    }
    return (campaigns.data || [])
      .map((c) => {
        const actual = spendByCampaign.get(c.id) || 0
        return {
          id: c.id,
          name: c.name,
          budget: c.budget_estimated,
          actual,
          variance: c.budget_estimated - actual,
          utilization: c.budget_estimated > 0 ? Math.round((actual / c.budget_estimated) * 100) : 0,
        }
      })
      .filter((r) => r.budget > 0 || r.actual > 0)
      .sort((a, b) => b.actual - a.actual)
  }, [expenses.data, campaigns.data])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.budget += r.budget
        acc.actual += r.actual
        return acc
      },
      { budget: 0, actual: 0 }
    )
  }, [rows])

  if (campaigns.isLoading || expenses.isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <PageSection title="Budget vs Actual" subtitle="Estimated budget compared with actual expenses per campaign">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Budget" value={formatCurrency(totals.budget)} />
        <StatCard title="Total Actual Spend" value={formatCurrency(totals.actual)} accent="text-primary" />
        <StatCard
          title="Overall Variance"
          value={formatCurrency(totals.budget - totals.actual)}
          accent={totals.budget - totals.actual < 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No budget/expense data yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden text-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.budget)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.actual)}</TableCell>
                  <TableCell className={`text-right font-medium ${r.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(r.variance)}
                  </TableCell>
                  <TableCell className="text-right">{r.utilization}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageSection>
  )
}