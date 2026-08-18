import { NavLink, useLocation } from 'react-router-dom'
import { NavSection } from '../../lib/navigation'
import { cn } from '../../lib/utils/cn'

interface ModuleTabsProps {
  section: NavSection
  className?: string
}

/** Horizontal tab bar for the sub-items of a navigation section. */
export function ModuleTabs({ section, className }: ModuleTabsProps) {
  const { pathname } = useLocation()

  return (
    <div className={cn('flex gap-1 overflow-x-auto pb-2', className)}>
      {section.children.map((item) => {
        const isActive = pathname === item.path
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'inline-flex shrink-0 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )
}
