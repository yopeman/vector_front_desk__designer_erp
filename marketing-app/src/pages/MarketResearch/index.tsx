import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useMarketInsights } from '../../lib/hooks/useMarketInsights'
import { MarketInsight } from '../../types/database'
import { navigation } from '../../lib/navigation'
import { MarketInsightList } from '../../components/modules/marketInsights/MarketInsightList'
import { MarketInsightForm } from '../../components/modules/marketInsights/MarketInsightForm'
import { ModuleTabs } from '../../components/shared/ModuleTabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

const section = navigation.find((s) => s.label === 'Market Research')!

export default function MarketResearchPage() {
  const { filter } = useParams()
  const { insights, createInsight, updateInsight, deleteInsight } = useMarketInsights()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInsight, setEditingInsight] = useState<MarketInsight | undefined>()

  const filtered = useMemo(() => {
    if (!filter) return insights.data || []
    return (insights.data || []).filter((i) => i.type === filter)
  }, [insights.data, filter])

  const activeItem = section.children.find(
    (item) => item.path === `/market-research${filter ? '/' + filter : ''}`
  )

  const handleCreate = () => {
    setEditingInsight(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (insight: MarketInsight) => {
    setEditingInsight(insight)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this insight?')) {
      await deleteInsight.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<MarketInsight>) => {
    if (editingInsight) {
      await updateInsight.mutateAsync({ id: editingInsight.id, data })
    } else {
      await createInsight.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingInsight(undefined)
  }

  if (insights.isLoading) {
    return <div className="text-center py-12">Loading insights...</div>
  }

  if (insights.error) {
    return <div className="text-center py-12 text-red-600">Error loading insights</div>
  }

  return (
    <>
      <ModuleTabs section={section} className="mb-2" />
      <MarketInsightList
        insights={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title={activeItem ? activeItem.label : 'Market Research'}
        createLabel={activeItem ? `Add ${activeItem.label.replace(/s$/, '')}` : 'Add Insight'}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingInsight ? 'Edit Insight' : 'Add Insight'}</DialogTitle>
          </DialogHeader>
          <MarketInsightForm
            insight={editingInsight}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createInsight.isPending || updateInsight.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}