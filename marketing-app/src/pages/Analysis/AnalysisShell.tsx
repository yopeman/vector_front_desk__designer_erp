import { ReactNode } from 'react'
import { navigation } from '../../lib/navigation'
import { PageSection } from '../../components/shared/PageSection'
import { ModuleTabs } from '../../components/shared/ModuleTabs'

const section = navigation.find((s) => s.label === 'Marketing Analysis')!

interface AnalysisShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Wrapper that renders the analysis sub-item tabs plus page content. */
export function AnalysisShell({ title, subtitle, children }: AnalysisShellProps) {
  return (
    <PageSection title={title} subtitle={subtitle}>
      <ModuleTabs section={section} />
      {children}
    </PageSection>
  )
}
