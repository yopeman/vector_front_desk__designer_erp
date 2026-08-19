import { useMemo } from 'react'
import { navigation } from '../../lib/navigation'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatCurrency } from '../../lib/utils/formatters'

const section = navigation.find((s) => s.label === 'Marketing Plan')!

interface MonthGroup {
  key: string
  label: string
  campaigns: { id: string; name: string; start?: string; end?: string; status: string; budget: number }[]
}

export default function PlanCalendar() {
  const { campaigns } = useCampaigns()

  const months = useMemo<MonthGroup[]>(() => {
    const rows = campaigns.data || []
    const map = new Map<string, MonthGroup>()
    for (const c of rows) {
      const start = c.start_date || c.end_date
      const date = start ? new Date(start) : null
      const key = date ? `${date.getFullYear()}-${date.getMonth()}` : 'unknown'
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: date ? date.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'No date',
          campaigns: [],
        })
      }
      map.get(key)!.campaigns.push({
        id: c.id,
        name: c.name,
        start: c.start_date,
        end: c.end_date,
        status: c.status,
        budget: c.budget_estimated,
      })
    }
    const sorted = Array.from(map.values())
    // Sort unknown last, known groups chronologically
    sorted.sort((a, b) => {
      if (a.key === 'unknown') return 1
      if (b.key === 'unknown') return -1
      return a.key < b.key ? -1 : 1
    })
    for (const g of sorted) {
      g.campaigns.sort((a, b) => (a.start || '').localeCompare(b.start || ''))
    }
    return sorted
  }, [campaigns.data])

  if (campaigns.isLoading) return <div className="text-center py-12">Loading...</div>

  return (
    <PageSection title="Plan Calendar" subtitle="Campaigns on a timeline by start date">
      <ModuleTabs section={section} />
      {months.length === 0 ? (
        <p className="text-gray-500">No campaigns with dates yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {months.map((group) => (
            <div key={group.key}>
              <h2 className="mb-2 text-lg font-bold text-gray-900">{group.label}</h2>
              <div className="space-y-2">
                {group.campaigns.map((c) => (
                  <Card key={c.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{c.name}</CardTitle>
                        <StatusBadge status={c.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span className="text-gray-500">
                        From: <span className="font-medium text-gray-900">{c.start ? new Date(c.start).toLocaleDateString() : '—'}</span>
                      </span>
                      <span className="text-gray-500">
                        To: <span className="font-medium text-gray-900">{c.end ? new Date(c.end).toLocaleDateString() : '—'}</span>
                      </span>
                      <span className="text-gray-500">
                        Budget: <span className="font-medium text-gray-900">{formatCurrency(c.budget)}</span>
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageSection>
  )
}