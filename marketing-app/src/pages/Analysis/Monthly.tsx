import { useMemo } from 'react'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { useProposals } from '../../lib/hooks/useProposals'
import { useTenders } from '../../lib/hooks/useTenders'
import { useActivities } from '../../lib/hooks/useActivities'
import { useExpenses } from '../../lib/hooks/useExpenses'
import { AnalysisShell } from './AnalysisShell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { formatCurrency } from '../../lib/utils/formatters'

interface MonthRow {
  month: string
  campaigns: number
  proposals: number
  tenders: number
  activities: number
  expenses: number
  expenseTotal: number
}

function bucket(rows: { created_at?: string }[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of rows) {
    if (!r.created_at) continue
    const key = r.created_at.slice(0, 7) // YYYY-MM
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

export default function Monthly() {
  const { campaigns } = useCampaigns()
  const { proposals } = useProposals()
  const { tenders } = useTenders()
  const { activities } = useActivities()
  const { expenses } = useExpenses()

  const rows = useMemo<MonthRow[]>(() => {
    const sets: Record<string, Map<string, number>> = {
      campaigns: bucket(campaigns.data || []),
      proposals: bucket(proposals.data || []),
      tenders: bucket(tenders.data || []),
      activities: bucket(activities.data || []),
      expenses: bucket(expenses.data || []),
    }
    const expenseTotals = new Map<string, number>()
    for (const e of expenses.data || []) {
      if (!e.created_at) continue
      const key = e.created_at.slice(0, 7)
      expenseTotals.set(key, (expenseTotals.get(key) || 0) + e.amount)
    }

    const allKeys = new Set<string>()
    Object.values(sets).forEach((m) => m.forEach((_v, k) => allKeys.add(k)))
    expenseTotals.forEach((_v, k) => allKeys.add(k))

    const result: MonthRow[] = Array.from(allKeys)
      .map((month) => ({
        month,
        campaigns: sets.campaigns.get(month) || 0,
        proposals: sets.proposals.get(month) || 0,
        tenders: sets.tenders.get(month) || 0,
        activities: sets.activities.get(month) || 0,
        expenses: sets.expenses.get(month) || 0,
        expenseTotal: expenseTotals.get(month) || 0,
      }))
      .sort((a, b) => (a.month < b.month ? 1 : -1))
    return result
  }, [campaigns.data, proposals.data, tenders.data, activities.data, expenses.data])

  const loading =
    campaigns.isLoading || proposals.isLoading || tenders.isLoading || activities.isLoading || expenses.isLoading

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <AnalysisShell title="Monthly Analysis" subtitle="Activity and financials grouped by month">
      {rows.length === 0 ? (
        <p className="text-gray-500">No data yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
                <TableHead className="text-right">Proposals</TableHead>
                <TableHead className="text-right">Tenders</TableHead>
                <TableHead className="text-right">Activities</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Expense Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="font-medium">{r.month}</TableCell>
                  <TableCell className="text-right">{r.campaigns}</TableCell>
                  <TableCell className="text-right">{r.proposals}</TableCell>
                  <TableCell className="text-right">{r.tenders}</TableCell>
                  <TableCell className="text-right">{r.activities}</TableCell>
                  <TableCell className="text-right">{r.expenses}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.expenseTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AnalysisShell>
  )
}