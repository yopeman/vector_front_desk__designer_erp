import { MarketInsight } from '../../../types/database'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { formatDate } from '../../../lib/utils/formatters'
import { humanize } from '../../../lib/navigation'

interface MarketInsightListProps {
  insights: MarketInsight[]
  onEdit: (insight: MarketInsight) => void
  onDelete: (id: string) => void
  onCreate: () => void
  title?: string
  createLabel?: string
}

const typeStyles: Record<string, string> = {
  customer_need: 'bg-blue-100 text-blue-800',
  competitor: 'bg-red-100 text-red-800',
  market_trend: 'bg-purple-100 text-purple-800',
  new_opportunity: 'bg-green-100 text-green-800',
}

export function MarketInsightList({
  insights,
  onEdit,
  onDelete,
  onCreate,
  title = 'Market Research',
  createLabel = 'Add Insight',
}: MarketInsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No insights yet</p>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                <Badge className={typeStyles[insight.type] || 'bg-gray-100 text-gray-800'}>
                  {humanize(insight.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insight.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{insight.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Identified:</span>
                  <span>{formatDate(insight.date_identified, 'PP')}</span>
                </div>
                {insight.source && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Source:</span>
                    <span className="truncate max-w-[180px]">{insight.source}</span>
                  </div>
                )}
                {insight.relevance_score != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Relevance:</span>
                    <span>{insight.relevance_score}/10</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(insight)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(insight.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
