import { navigation } from '../../lib/navigation'
import { ActivityListPage } from '../activities/ActivityListPage'

const section = navigation.find((s) => s.label === 'Tasks')!

export default function TasksPage() {
  return <ActivityListPage section={section} basePath="/tasks" field="status" />
}
