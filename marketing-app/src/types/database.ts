// Database Enums
export type CampaignStatus = 'planned' | 'active' | 'completed' | 'on_hold' | 'archived'
export type ActivityType = 'content_production' | 'social_media' | 'website' | 'paid_ad' | 'visit' | 'meeting' | 'demo' | 'event' | 'follow_up' | 'other'
export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'overdue'
export type ProposalStatus = 'draft' | 'submitted' | 'follow_up' | 'accepted' | 'rejected' | 'on_hold'
export type ProformaStatus = 'requested' | 'submitted' | 'follow_up' | 'accepted' | 'rejected' | 'on_hold'
export type TenderStatus = 'opportunity' | 'preparation' | 'submitted' | 'follow_up' | 'awarded' | 'lost' | 'on_hold'
export type ExpenseCategory = 'advertising' | 'content' | 'events' | 'travel' | 'software' | 'personnel' | 'other'
export type InsightType = 'customer_need' | 'competitor' | 'market_trend' | 'new_opportunity'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

// Database Tables
export interface Campaign {
  id: string
  name: string
  description?: string
  status: CampaignStatus
  start_date?: string
  end_date?: string
  budget_estimated: number
  owner_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CampaignTarget {
  id: string
  campaign_id: string
  metric: string
  target_value?: number
  actual_value: number
  target_date?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  campaign_id?: string
  title: string
  type: ActivityType
  status: ActivityStatus
  scheduled_start?: string
  scheduled_end?: string
  completed_at?: string
  assigned_to?: string
  location?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  campaign_id?: string
  client_name: string
  client_email?: string
  amount: number
  status: ProposalStatus
  submitted_at?: string
  follow_up_at?: string
  accepted_at?: string
  owner_id?: string
  file_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProposalItem {
  id: string
  proposal_id: string
  product_service_id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface Proforma {
  id: string
  campaign_id?: string
  client_name: string
  client_email?: string
  amount: number
  status: ProformaStatus
  requested_at?: string
  submitted_at?: string
  accepted_at?: string
  owner_id?: string
  file_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProformaItem {
  id: string
  proforma_id: string
  product_service_id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface Tender {
  id: string
  campaign_id?: string
  title: string
  client_name?: string
  amount: number
  status: TenderStatus
  deadline?: string
  submitted_at?: string
  awarded_at?: string
  owner_id?: string
  file_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProductService {
  id: string
  name: string
  description?: string
  type: 'product' | 'service'
  category?: string
  unit_cost: number
  unit_price: number
  sku?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  campaign_id?: string
  category: ExpenseCategory
  description?: string
  amount: number
  expense_date: string
  receipt_url?: string
  submitted_by?: string
  approved_by?: string
  approval_status: ApprovalStatus
  created_at: string
  updated_at: string
}

export interface MarketInsight {
  id: string
  type: InsightType
  title: string
  description?: string
  source?: string
  date_identified: string
  relevance_score?: number
  campaign_id?: string
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Note {
  id: string
  title: string
  content?: string
  color: string
  is_pinned: boolean
  checklists: ChecklistItem[]
  owner_id?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  name?: string
  is_group_chat: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

// Join types with relations
export interface CampaignWithTargets extends Campaign {
  targets?: CampaignTarget[]
}

export interface ProposalWithItems extends Proposal {
  items?: ProposalItem[]
}

export interface ProformaWithItems extends Proforma {
  items?: ProformaItem[]
}
