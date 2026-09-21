import { useNavigate } from 'react-router-dom';
import FloatingAssistant from '../components/FloatingAssistant';

export function Assistant() {
  const navigate = useNavigate();

  return (
    <div className="h-[calc(100vh-160px)] flex">
      <FloatingAssistant
        onNavigate={(action) => {
          const map = {
            'report': '/reports',
            'reports': '/reports',
            'purchases': '/purchases',
            'sales': '/sales',
            'inventory': '/inventory',
            'accounts': '/chart-of-accounts',
            'journal': '/general-journal',
            'payroll': '/payroll',
            'messages': '/messages',
            'notifications': '/notifications',
            'notes': '/notes',
            'settings': '/settings',
          };
          const path = map[action];
          if (path) navigate(path);
        }}
        embedded
      />
    </div>
  );
}

export default Assistant;