import { navigation } from '../../lib/navigation'
import { ActivityListPage } from '../activities/ActivityListPage'

const section = navigation.find((s) => s.label === 'Digital Marketing')!

export default function DigitalPage() {
  return <ActivityListPage section={section} basePath="/digital" field="type" />
}
