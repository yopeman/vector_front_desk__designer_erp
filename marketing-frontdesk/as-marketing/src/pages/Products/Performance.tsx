import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useLineItems } from '../../lib/hooks/useLineItems'
import { useProducts } from '../../lib/hooks/useProducts'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { StatCard } from '../../components/shared/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { formatCurrency, formatNumber } from '../../lib/utils/formatters'
import { TrendingUp } from 'lucide-react'

const section = navigation.find((s) => s.label === 'Product & Service Marketing')!

export default function ProductPerformance() {
  const { proposalItems, proformaItems, isLoading } = useLineItems()
  const { products } = useProducts()

  const rows = useMemo(() => {
    if (proposalItems.isError || proformaItems.isError) return []
    const productsById = new Map((products.data || []).map((p) => [p.id, p]))
    const agg = new Map<string, { name: string; type: string; quantity: number; revenue: number }>()

    const combine = (id: string | undefined, description: string, qty: number, total: number) => {
      const product = id ? productsById.get(id) : undefined
      const key = id || description
      const current = agg.get(key) || { name: product?.name || description, type: product?.type || '—', quantity: 0, revenue: 0 }
      current.quantity += qty
      current.revenue += total
      agg.set(key, current)
    }

    ;(proposalItems.data || []).forEach((it) => combine(it.product_service_id, it.description, it.quantity, it.total))
    ;(proformaItems.data || []).forEach((it) => combine(it.product_service_id, it.description, it.quantity, it.total))

    return Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue)
  }, [proposalItems.data, proformaItems.data, products.data, proposalItems.isError, proformaItems.isError])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.quantity += r.quantity
        acc.revenue += r.revenue
        return acc
      },
      { quantity: 0, revenue: 0 }
    )
  }, [rows])

  if (isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <PageSection title="Performance" subtitle="Most marketed products & services by line-item sales data">
      <ModuleTabs section={section} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Unique Items" value={rows.length} icon={TrendingUp} />
        <StatCard title="Total Quantity" value={formatNumber(totals.quantity, 0)} />
        <StatCard title="Total Revenue (Line Items)" value={formatCurrency(totals.revenue)} accent="text-green-600" />
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No line-item sales data yet.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="capitalize">{row.type}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageSection>
  )
}