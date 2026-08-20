import { navigation } from '../../lib/navigation'
import { ActivityListPage } from '../activities/ActivityListPage'

const section = navigation.find((s) => s.label === 'Physical Marketing')!

export default function PhysicalPage() {
  return <ActivityListPage section={section} basePath="/physical" field="type" />
}
