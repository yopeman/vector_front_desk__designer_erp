import { ReactNode } from 'react'

interface PageSectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function PageSection({ title, subtitle, action, children }: PageSectionProps) {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
