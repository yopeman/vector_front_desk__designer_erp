import { useNavigate } from 'react-router-dom'
import FloatingAssistant from '../../components/modules/FloatingAssistant'

export default function Assistant() {
  const navigate = useNavigate()

  return (
    <div className="h-[calc(100vh-160px)] flex">
      <FloatingAssistant
        onNavigate={(action: string) => {
          const map: Record<string, string> = {
            'report': '/reports',
            'reports': '/reports',
            'campaigns': '/campaigns',
            'plans': '/plans',
            'tasks': '/tasks',
            'costs': '/costs',
            'proposals': '/proposals',
            'products': '/products/product',
            'analysis': '/analysis/kpis',
            'designs': '/products/product',
            'messages': '/messages',
            'settings': '/settings',
          }
          const path = map[action]
          if (path) navigate(path)
        }}
        embedded
      />
    </div>
  )
}