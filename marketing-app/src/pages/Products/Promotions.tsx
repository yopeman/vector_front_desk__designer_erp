import { navigation } from '../../lib/navigation'
import { useCampaigns } from '../../lib/hooks/useCampaigns'
import { useProducts } from '../../lib/hooks/useProducts'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatCurrency } from '../../lib/utils/formatters'

const section = navigation.find((s) => s.label === 'Product & Service')!

export default function Promotions() {
  const { campaigns } = useCampaigns()
  const { products } = useProducts()

  const activeCampaigns = (campaigns.data || []).filter((c) => c.status === 'active')

  return (
    <PageSection title="Promotions" subtitle="Products & services currently being marketed through active campaigns">
      <ModuleTabs section={section} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Active Campaigns</h2>
          {activeCampaigns.length === 0 ? (
            <p className="text-gray-500">No active campaigns promoting products.</p>
          ) : (
            <div className="space-y-3">
              {activeCampaigns.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <StatusBadge status={c.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-500">
                    {c.description || 'No description'}
                    {c.budget_estimated > 0 && (
                      <p className="mt-1 font-medium text-gray-900">
                        Budget: {formatCurrency(c.budget_estimated)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Marketing Catalog</h2>
          {!products.data?.length ? (
            <p className="text-gray-500">No products or services in the catalog yet.</p>
          ) : (
            <div className="space-y-3">
              {(products.data || []).map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                    <span className="capitalize">Type: {p.type}</span>
                    <span>Price: {formatCurrency(p.unit_price)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageSection>
  )
}