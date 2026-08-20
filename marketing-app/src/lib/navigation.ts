import {
  LayoutDashboard,
  Rocket,
  Monitor,
  Handshake,
  FileText,
  FileSpreadsheet,
  Landmark,
  Package,
  Search,
  Wallet,
  CheckSquare,
  BarChart3,
  Settings,
  StickyNote,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  /** Filter value (status/type/etc.) applied by the routed page. Omit for "all"/overview views. */
  value?: string
}

export interface NavSection {
  label: string
  icon: LucideIcon
  children: NavItem[]
}

export const navigation: NavSection[] = [
  {
    label: 'Marketing Plan',
    icon: LayoutDashboard,
    children: [
      { label: 'Dashboard', path: '/plan' },
      { label: 'Calendar', path: '/plan/calendar' },
      { label: 'Targets', path: '/plan/targets' },
    ],
  },
  {
    label: 'Campaigns',
    icon: Rocket,
    children: [
      { label: 'All', path: '/campaigns' },
      { label: 'Planned', path: '/campaigns/planned', value: 'planned' },
      { label: 'Active', path: '/campaigns/active', value: 'active' },
      { label: 'Completed', path: '/campaigns/completed', value: 'completed' },
      { label: 'On Hold', path: '/campaigns/on_hold', value: 'on_hold' },
      { label: 'Archived', path: '/campaigns/archived', value: 'archived' },
    ],
  },
  {
    label: 'Digital Marketing',
    icon: Monitor,
    children: [
      { label: 'Content Plan', path: '/digital/content_production', value: 'content_production' },
      { label: 'Social Media', path: '/digital/social_media', value: 'social_media' },
      { label: 'Website', path: '/digital/website', value: 'website' },
      { label: 'Paid Ads', path: '/digital/paid_ad', value: 'paid_ad' },
      { label: 'Performance', path: '/digital/performance' },
    ],
  },
  {
    label: 'Physical Marketing',
    icon: Handshake,
    children: [
      { label: 'Visits', path: '/physical/visit', value: 'visit' },
      { label: 'Meetings', path: '/physical/meeting', value: 'meeting' },
      { label: 'Demos', path: '/physical/demo', value: 'demo' },
      { label: 'Events', path: '/physical/event', value: 'event' },
      { label: 'Follow-ups==========', path: '/physical/follow-up', value: 'follow_up' },
      { label: 'Other', path: '/physical/other', value: 'other' },
    ],
  },
  {
    label: 'Proposals',
    icon: FileText,
    children: [
      { label: 'All', path: '/proposals' },
      { label: 'Draft', path: '/proposals/draft', value: 'draft' },
      { label: 'Submitted', path: '/proposals/submitted', value: 'submitted' },
      { label: 'Follow-up', path: '/proposals/follow_up', value: 'follow_up' },
      { label: 'Accepted', path: '/proposals/accepted', value: 'accepted' },
      { label: 'Rejected', path: '/proposals/rejected', value: 'rejected' },
      { label: 'On Hold', path: '/proposals/on_hold', value: 'on_hold' },
    ],
  },
  {
    label: 'Proforma',
    icon: FileSpreadsheet,
    children: [
      { label: 'All', path: '/proformas' },
      { label: 'Requested', path: '/proformas/requested', value: 'requested' },
      { label: 'Submitted', path: '/proformas/submitted', value: 'submitted' },
      { label: 'Follow-up', path: '/proformas/follow_up', value: 'follow_up' },
      { label: 'Accepted', path: '/proformas/accepted', value: 'accepted' },
      { label: 'Rejected', path: '/proformas/rejected', value: 'rejected' },
      { label: 'On Hold', path: '/proformas/on_hold', value: 'on_hold' },
    ],
  },
  {
    label: 'Tenders',
    icon: Landmark,
    children: [
      { label: 'All', path: '/tenders' },
      { label: 'Opportunities', path: '/tenders/opportunity', value: 'opportunity' },
      { label: 'Preparation', path: '/tenders/preparation', value: 'preparation' },
      { label: 'Submitted', path: '/tenders/submitted', value: 'submitted' },
      { label: 'Follow-up', path: '/tenders/follow_up', value: 'follow_up' },
      { label: 'Awarded', path: '/tenders/awarded', value: 'awarded' },
      { label: 'Lost', path: '/tenders/lost', value: 'lost' },
      { label: 'On Hold', path: '/tenders/on_hold', value: 'on_hold' },
    ],
  },
  {
    label: 'Product & Service Marketing',
    icon: Package,
    children: [
      { label: 'Products', path: '/products/product', value: 'product' },
      { label: 'Services', path: '/products/service', value: 'service' },
      { label: 'Promotions', path: '/products/promotions' },
      { label: 'Performance', path: '/products/performance' },
    ],
  },
  {
    label: 'Market Research',
    icon: Search,
    children: [
      { label: 'All', path: '/market-research' },
      { label: 'Customer Needs', path: '/market-research/customer_need', value: 'customer_need' },
      { label: 'Competitors', path: '/market-research/competitor', value: 'competitor' },
      { label: 'Market Trends', path: '/market-research/market_trend', value: 'market_trend' },
      { label: 'New Opportunities', path: '/market-research/new_opportunity', value: 'new_opportunity' },
    ],
  },
  {
    label: 'Marketing Costs',
    icon: Wallet,
    children: [
      { label: 'Budget Overview', path: '/costs' },
      { label: 'Expenses', path: '/costs/expenses' },
      { label: 'Campaign Costs', path: '/costs/campaign-costs' },
      { label: 'Budget vs Actual', path: '/costs/budget-vs-actual' },
    ],
  },
  {
    label: 'Marketing Tasks',
    icon: CheckSquare,
    children: [
      { label: 'All Tasks', path: '/tasks' },
      { label: 'Planned', path: '/tasks/planned', value: 'planned' },
      { label: 'In Progress', path: '/tasks/in_progress', value: 'in_progress' },
      { label: 'Completed', path: '/tasks/completed', value: 'completed' },
      { label: 'Overdue', path: '/tasks/overdue', value: 'overdue' },
    ],
  },
  {
    label: 'Marketing Analysis',
    icon: BarChart3,
    children: [
      { label: 'KPIs', path: '/analysis/kpis' },
      { label: 'Lead & Conversion', path: '/analysis/lead-conversion' },
      { label: 'Digital Performance', path: '/analysis/digital-performance' },
      { label: 'Physical Performance', path: '/analysis/physical-performance' },
      { label: 'Proposal Funnel', path: '/analysis/proposal-funnel' },
      { label: 'Costs & ROI', path: '/analysis/costs-roi' },
      { label: 'Monthly Analysis', path: '/analysis/monthly' },
    ],
  },
  {
    label: 'Communication',
    icon: MessageSquare,
    children: [
      { label: 'Messages', path: '/messages' },
      { label: 'Notes', path: '/notes' },
    ],
  },
]

export const settingsNav = { label: 'Settings', path: '/settings', icon: Settings }

/** Finds the section that owns a given path (used to auto-expand the active section). */
export function findSectionForPath(pathname: string): NavSection | undefined {
  return navigation.find(
    (section) =>
      pathname === section.children[0].path ||
      section.children.some((item) => pathname === item.path || pathname.startsWith(item.path + '/'))
  )
}

/** Finds the active nav item within a section for the given path. */
export function findActiveItem(section: NavSection, pathname: string): NavItem | undefined {
  return section.children.find((item) => pathname === item.path)
}

/** Human-readable label for an enum value (e.g. 'content_production' -> 'Content Production'). */
export function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
