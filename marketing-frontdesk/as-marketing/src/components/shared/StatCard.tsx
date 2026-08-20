import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  /** Tailwind text color class for the icon/emphasis (e.g. 'text-primary'). */
  accent?: string
}

export function StatCard({ title, value, sub, icon: Icon, accent = 'text-primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
          </div>
          {Icon && (
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50', accent)}>
              <Icon className="h-5 w-5" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
