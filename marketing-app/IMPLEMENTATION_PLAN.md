# Marketing ERP Implementation Plan

**Brand Color:** `#00CED1` (Dark Cyan)
**Backend:** Supabase (no custom backend)
**Tech Stack:** React 19 + Vite + TypeScript + TailwindCSS + shadcn/ui

---

## Phase 1: Project Setup & Supabase Installation

### 1.1 Initialize Project Structure
- [ ] Verify current React + Vite setup
- [ ] Install TypeScript (if not already installed)
- [ ] Configure `tsconfig.json` for strict type checking
- [ ] Set up ESLint and Prettier for code quality

### 1.2 Install Core Dependencies
```bash
npm install @supabase/supabase-js@^2.39.0
npm install @tanstack/react-query@^5.17.0
npm install react-router-dom@^6.21.0
npm install zustand@^4.4.7
npm install lucide-react@^0.303.0
npm install date-fns@^3.0.0
npm install recharts@^2.10.0
npm install react-hook-form@^7.49.0
npm install zod@^3.22.0
npm install @hookform/resolvers@^3.3.0
npm install clsx@^2.0.0
npm install tailwind-merge@^2.2.0
```

### 1.3 Install UI Dependencies
```bash
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
npm install class-variance-authority@^0.7.0
npm install @radix-ui/react-slot@^1.0.2
npm install @radix-ui/react-dialog@^1.0.5
npm install @radix-ui/react-dropdown-menu@^2.0.6
npm install @radix-ui/react-label@^2.0.2
npm install @radix-ui/react-select@^2.0.0
npm install @radix-ui/react-tabs@^1.0.4
npm install @radix-ui/react-toast@^1.1.5
```

### 1.4 Configure TailwindCSS with Brand Color
- [ ] Initialize TailwindCSS: `npx tailwindcss init -p`
- [ ] Update `tailwind.config.js` with brand color:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00CED1',
          50: '#E6F9FA',
          100: '#CCF4F5',
          200: '#99E9EB',
          300: '#66DEE0',
          400: '#33D3D6',
          500: '#00CED1',
          600: '#00A8A7',
          700: '#00827D',
          800: '#005C53',
          900: '#003629',
        }
      }
    }
  }
}
```

### 1.5 Set Up Supabase
- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Get project URL and anon key from Supabase dashboard
- [ ] Create `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Initialize Supabase locally: `supabase init`
- [ ] Link to remote project: `supabase link --project-ref your_project_id`

### 1.6 Configure Supabase Auth
- [ ] Enable email authentication in Supabase dashboard
- [ ] Configure email templates (optional)
- [ ] Set up user roles in Supabase (executive, manager, team_member)
- [ ] Create Row Level Security (RLS) policies

---

## Phase 2: Database Schema Migration

### 2.1 Create Migration File
- [ ] Create migration file: `supabase/migrations/001_initial_schema.sql`
- [ ] Copy the provided database schema into the migration file

### 2.2 Database Schema Components
The schema includes:
- **Enums**: campaign_status, activity_type, activity_status, proposal_status, proforma_status, tender_status, expense_category, insight_type
- **Core Tables**:
  - `campaigns` - Marketing plans with targets
  - `campaign_targets` - KPI tracking (leads, conversions, ROI)
  - `activities` - Unified digital + physical marketing activities
  - `proposals` - Proposal management with line items
  - `proformas` - Preliminary quotations with line items
  - `tenders` - Tender/opportunity tracking
  - `products_services` - Product/service catalog
  - `expenses` - Marketing cost tracking
  - `market_insights` - Market research data
  - `proposal_items` - Line items for proposals
  - `proforma_items` - Line items for proformas

### 2.3 Apply Migration
- [ ] Run local migration: `supabase db push`
- [ ] Verify tables created in local Supabase
- [ ] Push to remote: `supabase db push --linked`
- [ ] Verify schema in Supabase dashboard

### 2.4 Set Up Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create policies for:
  - Campaigns: Owners can read/write their campaigns
  - Activities: Assigned users can read/write
  - Proposals/Proformas/Tenders: Owner-based access
  - Expenses: Submitted by/approved by access
  - Market Insights: Read access for all, write for managers+

### 2.5 Create Database Functions
- [ ] Add helper functions for:
  - Campaign ROI calculation
  - Budget vs actual comparison
  - Activity completion rates
  - Proposal conversion tracking

---

## Phase 3: Frontend Infrastructure Setup

### 3.1 Create Project Directory Structure
```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── config.ts
│   ├── api/
│   │   ├── campaigns.ts
│   │   ├── activities.ts
│   │   ├── proposals.ts
│   │   ├── proformas.ts
│   │   ├── tenders.ts
│   │   ├── expenses.ts
│   │   ├── insights.ts
│   │   └── products.ts
│   ├── hooks/
│   │   ├── useCampaigns.ts
│   │   ├── useActivities.ts
│   │   ├── useProposals.ts
│   │   ├── useProformas.ts
│   │   ├── useTenders.ts
│   │   ├── useExpenses.ts
│   │   ├── useInsights.ts
│   │   └── useProducts.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
├── stores/
│   ├── authStore.ts
│   ├── campaignStore.ts
│   └── uiStore.ts
├── types/
│   └── database.ts
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── modules/
│   │   ├── campaigns/
│   │   ├── activities/
│   │   ├── proposals/
│   │   ├── proformas/
│   │   ├── tenders/
│   │   ├── expenses/
│   │   ├── insights/
│   │   └── products/
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── DateRangePicker.tsx
│       └── DataTable.tsx
├── pages/
│   ├── Dashboard/
│   ├── Campaigns/
│   ├── Activities/
│   ├── Proposals/
│   ├── Proformas/
│   ├── Tenders/
│   ├── Expenses/
│   ├── Insights/
│   ├── Products/
│   ├── Settings/
│   ├── Login/
│   └── Register/
├── App.tsx
└── main.tsx
```

### 3.2 Create TypeScript Types
- [ ] Create `src/types/database.ts` with all database types
- [ ] Define enum types matching database enums
- [ ] Create interfaces for all tables
- [ ] Add type guards for runtime validation

### 3.3 Set Up Supabase Client
- [ ] Create `src/lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3.4 Configure React Query
- [ ] Create `src/lib/api/queryClient.ts`
- [ ] Set up QueryClient with proper defaults
- [ ] Configure error handling and retry logic
- [ ] Wrap App with QueryClientProvider

### 3.5 Set Up Authentication
- [ ] Create `src/lib/supabase/auth.ts` with auth functions
- [ ] Create `src/stores/authStore.ts` using Zustand
- [ ] Implement login, register, logout functions
- [ ] Add session management
- [ ] Create protected route wrapper

### 3.6 Configure React Router
- [ ] Install react-router-dom
- [ ] Create `src/App.tsx` with router configuration
- [ ] Set up routes for all modules
- [ ] Implement protected routes with auth check
- [ ] Create 404 page

### 3.7 Set Up shadcn/ui Components
- [ ] Initialize shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Install core components:
  - Button
  - Card
  - Input
  - Label
  - Select
  - Dialog
  - Dropdown Menu
  - Tabs
  - Table
  - Badge
  - Toast
- [ ] Customize components with brand color (#00CED1)

### 3.8 Create Base Layouts
- [ ] Create `DashboardLayout.tsx` with sidebar navigation
- [ ] Create `AuthLayout.tsx` for login/register pages
- [ ] Implement responsive design
- [ ] Add user menu with logout option

---

## Phase 4: MVP Modules Implementation

### 4.1 Campaigns Module
**Features:**
- Campaign CRUD operations
- Campaign status management (Planned → Active → Completed)
- Target management (KPIs: leads, conversions, ROI)
- Budget tracking
- Campaign timeline view
- Kanban board view

**Implementation Steps:**
- [ ] Create `src/lib/api/campaigns.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useCampaigns.ts` custom hook
- [ ] Create `src/components/modules/campaigns/CampaignList.tsx`
- [ ] Create `src/components/modules/campaigns/CampaignForm.tsx`
- [ ] Create `src/components/modules/campaigns/CampaignCard.tsx`
- [ ] Create `src/components/modules/campaigns/TargetForm.tsx`
- [ ] Create `src/components/modules/campaigns/CampaignDetails.tsx`
- [ ] Create `src/pages/Campaigns/index.tsx`
- [ ] Implement Kanban board view
- [ ] Add campaign filtering and search

### 4.2 Activities Module
**Features:**
- Unified digital + physical activity tracking
- Calendar view for scheduling
- Timeline view for activity history
- Activity type filtering (content, social media, visits, demos, events)
- Assignment and status tracking
- Activity completion tracking

**Implementation Steps:**
- [ ] Create `src/lib/api/activities.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useActivities.ts` custom hook
- [ ] Create `src/components/modules/activities/ActivityList.tsx`
- [ ] Create `src/components/modules/activities/ActivityForm.tsx`
- [ ] Create `src/components/modules/activities/ActivityCalendar.tsx`
- [ ] Create `src/components/modules/activities/ActivityTimeline.tsx`
- [ ] Create `src/pages/Activities/index.tsx`
- [ ] Implement calendar integration
- [ ] Add activity filtering by type and status

### 4.3 Proposals Module
**Features:**
- Proposal lifecycle management (Draft → Submitted → Follow-up → Accepted/Rejected)
- Line item management with auto-calculations
- Document upload for PDFs
- Follow-up reminders
- Status workflow automation
- Proposal tracking dashboard

**Implementation Steps:**
- [ ] Create `src/lib/api/proposals.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useProposals.ts` custom hook
- [ ] Create `src/components/modules/proposals/ProposalList.tsx`
- [ ] Create `src/components/modules/proposals/ProposalForm.tsx`
- [ ] Create `src/components/modules/proposals/LineItemsForm.tsx`
- [ ] Create `src/components/modules/proposals/ProposalDetails.tsx`
- [ ] Create `src/pages/Proposals/index.tsx`
- [ ] Implement file upload for proposal PDFs
- [ ] Add follow-up reminder system

### 4.4 Tenders Module
**Features:**
- Tender opportunity tracking
- Status management (Opportunity → Preparation → Submitted → Awarded/Lost)
- Deadline tracking
- Document management
- Tender history and notes

**Implementation Steps:**
- [ ] Create `src/lib/api/tenders.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useTenders.ts` custom hook
- [ ] Create `src/components/modules/tenders/TenderList.tsx`
- [ ] Create `src/components/modules/tenders/TenderForm.tsx`
- [ ] Create `src/components/modules/tenders/TenderDetails.tsx`
- [ ] Create `src/pages/Tenders/index.tsx`
- [ ] Implement deadline tracking
- [ ] Add tender status workflow

---

## Phase 5: Financial Modules

### 5.1 Proformas Module
**Features:**
- Preliminary quotation management
- Line item management with auto-calculations
- Status tracking (Requested → Submitted → Follow-up → Accepted/Rejected)
- Client communication tracking
- Proforma to proposal conversion

**Implementation Steps:**
- [ ] Create `src/lib/api/proformas.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useProformas.ts` custom hook
- [ ] Create `src/components/modules/proformas/ProformaList.tsx`
- [ ] Create `src/components/modules/proformas/ProformaForm.tsx`
- [ ] Create `src/components/modules/proformas/LineItemsForm.tsx`
- [ ] Create `src/components/modules/proformas/ProformaDetails.tsx`
- [ ] Create `src/pages/Proformas/index.tsx`
- [ ] Implement conversion to proposal feature

### 5.2 Expenses Module
**Features:**
- Real-time budget vs actual tracking
- Expense approval workflow
- Receipt upload and management
- Category-based reporting
- Expense submission forms
- Budget utilization dashboard

**Implementation Steps:**
- [ ] Create `src/lib/api/expenses.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useExpenses.ts` custom hook
- [ ] Create `src/components/modules/expenses/ExpenseList.tsx`
- [ ] Create `src/components/modules/expenses/ExpenseForm.tsx`
- [ ] Create `src/components/modules/expenses/BudgetDashboard.tsx`
- [ ] Create `src/components/modules/expenses/ExpenseApproval.tsx`
- [ ] Create `src/pages/Expenses/index.tsx`
- [ ] Implement receipt upload
- [ ] Add approval workflow
- [ ] Create budget vs actual charts

### 5.3 Products/Services Catalog
**Features:**
- Master data management
- Product/service categorization
- SKU management
- Cost and price tracking
- Catalog search and filtering

**Implementation Steps:**
- [ ] Create `src/lib/api/products.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useProducts.ts` custom hook
- [ ] Create `src/components/modules/products/ProductList.tsx`
- [ ] Create `src/components/modules/products/ProductForm.tsx`
- [ ] Create `src/pages/Products/index.tsx`
- [ ] Implement search and filtering
- [ ] Add SKU validation

---

## Phase 6: Analytics & Dashboards

### 6.1 Market Insights Module
**Features:**
- Competitor tracking
- Market trend analysis
- Customer need identification
- New opportunity logging
- Insight relevance scoring
- Insight-to-campaign linking

**Implementation Steps:**
- [ ] Create `src/lib/api/insights.ts` with Supabase queries
- [ ] Create `src/lib/hooks/useInsights.ts` custom hook
- [ ] Create `src/components/modules/insights/InsightList.tsx`
- [ ] Create `src/components/modules/insights/InsightForm.tsx`
- [ ] Create `src/components/modules/insights/InsightDashboard.tsx`
- [ ] Create `src/pages/Insights/index.tsx`
- [ ] Implement insight tagging
- [ ] Add relevance scoring

### 6.2 Role-Based Dashboards

#### Executive Dashboard
**Features:**
- High-level KPIs overview
- Overall budget vs actual
- ROI by channel
- Campaign performance summary
- Proposal conversion rates
- Revenue trends

**Implementation Steps:**
- [ ] Create `src/pages/Dashboard/ExecutiveDashboard.tsx`
- [ ] Implement KPI cards with charts
- [ ] Add budget vs actual visualization
- [ ] Create ROI by channel chart
- [ ] Add executive summary reports

#### Marketing Manager Dashboard
**Features:**
- Campaign progress monitoring
- Team task completion rates
- Lead conversion funnels
- Activity timeline
- Team performance metrics
- Pending approvals

**Implementation Steps:**
- [ ] Create `src/pages/Dashboard/ManagerDashboard.tsx`
- [ ] Implement campaign progress charts
- [ ] Add team performance metrics
- [ ] Create lead conversion funnel
- [ ] Add activity timeline view
- [ ] Implement approval queue

#### Team Member Dashboard
**Features:**
- Personal to-do lists
- Pending follow-ups
- Assigned activities
- Expense submission forms
- Task calendar
- Personal performance metrics

**Implementation Steps:**
- [ ] Create `src/pages/Dashboard/TeamDashboard.tsx`
- [ ] Implement personal task list
- [ ] Add follow-up reminders
- [ ] Create activity calendar
- [ ] Add expense submission form
- [ ] Implement personal metrics

### 6.3 Advanced Analytics
**Features:**
- Campaign ROI calculations
- Budget adherence tracking
- Activity completion rates
- Proposal conversion tracking
- Expense category analysis
- Time-based trend analysis

**Implementation Steps:**
- [ ] Create analytics utility functions
- [ ] Implement ROI calculation logic
- [ ] Add budget adherence formulas
- [ ] Create conversion rate tracking
- [ ] Build trend analysis charts
- [ ] Add export functionality for reports

---

## Phase 7: Testing & Deployment

### 7.1 Testing
**Unit Testing:**
- [ ] Install Vitest: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
- [ ] Configure Vitest
- [ ] Write unit tests for API functions
- [ ] Write unit tests for custom hooks
- [ ] Write unit tests for utility functions

**Integration Testing:**
- [ ] Test Supabase integration
- [ ] Test authentication flow
- [ ] Test CRUD operations for all modules
- [ ] Test form submissions
- [ ] Test file uploads

**E2E Testing:**
- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Configure Playwright
- [ ] Write E2E tests for critical user flows
- [ ] Test authentication flow
- [ ] Test campaign creation and management
- [ ] Test proposal lifecycle
- [ ] Test expense submission and approval

### 7.2 Performance Optimization
- [ ] Implement code splitting
- [ ] Add lazy loading for routes
- [ ] Optimize images and assets
- [ ] Implement caching strategies with React Query
- [ ] Add loading states and skeletons
- [ ] Optimize database queries

### 7.3 Security Hardening
- [ ] Verify all RLS policies are working
- [ ] Implement proper error handling
- [ ] Add input validation on all forms
- [ ] Sanitize user inputs
- [ ] Implement rate limiting (Supabase)
- [ ] Add CSRF protection
- [ ] Secure file uploads

### 7.4 Deployment Preparation
**Environment Setup:**
- [ ] Create production environment variables
- [ ] Configure production Supabase project
- [ ] Set up production database
- [ ] Run production migrations
- [ ] Configure production auth settings

**Build Configuration:**
- [ ] Update Vite config for production
- [ ] Configure build optimization
- [ ] Set up asset CDN (optional)
- [ ] Configure PWA (optional)

### 7.5 Deployment
**Build Process:**
- [ ] Run production build: `npm run build`
- [ ] Test production build locally
- [ ] Verify all environment variables

**Deployment Options:**
- [ ] Deploy to Vercel (recommended)
- [ ] Deploy to Netlify
- [ ] Deploy to custom server
- [ ] Configure custom domain
- [ ] Set up SSL certificates

**Post-Deployment:**
- [ ] Verify all functionality in production
- [ ] Test authentication flow
- [ ] Test database connections
- [ ] Monitor error logs
- [ ] Set up analytics (optional)
- [ ] Configure backup strategy

### 7.6 Monitoring & Maintenance
**Monitoring:**
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Monitor database performance
- [ ] Track user analytics

**Maintenance:**
- [ ] Create backup schedule
- [ ] Set up database backup automation
- [ ] Plan regular security updates
- [ ] Schedule dependency updates
- [ ] Create update documentation

---

## Phase 8: Documentation & Handover

### 8.1 Technical Documentation
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Document component architecture
- [ ] Document state management
- [ ] Document authentication flow

### 8.2 User Documentation
- [ ] Create user guide
- [ ] Create video tutorials
- [ ] Document role-based access
- [ ] Create troubleshooting guide
- [ ] Document best practices

### 8.3 Developer Documentation
- [ ] Setup guide for new developers
- [ ] Code contribution guidelines
- [ ] Testing guidelines
- [ ] Deployment guide
- [ ] Architecture diagrams

---

## Appendix

### A. Environment Variables Template
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### B. Key Dependencies Versions
```json
{
  "react": "^19.2.8",
  "react-dom": "^19.2.8",
  "@supabase/supabase-js": "^2.39.0",
  "@tanstack/react-query": "^5.17.0",
  "react-router-dom": "^6.21.0",
  "zustand": "^4.4.7",
  "lucide-react": "^0.303.0",
  "tailwindcss": "^3.4.0",
  "date-fns": "^3.0.0",
  "recharts": "^2.10.0",
  "react-hook-form": "^7.49.0",
  "zod": "^3.22.0"
}
```

### C. Brand Color Usage
**Primary Color:** `#00CED1` (Dark Cyan)

**Usage Guidelines:**
- Primary buttons and CTAs
- Active states and highlights
- Links and navigation
- Charts and data visualization
- Status indicators (success/active)

**Color Variants:**
- Light backgrounds: `#E6F9FA` (primary-50)
- Hover states: `#00A8A7` (primary-600)
- Disabled states: `#99E9EB` (primary-200)

### D. Supabase CLI Commands Reference
```bash
# Initialize Supabase
supabase init

# Link to remote project
supabase link --project-ref your_project_id

# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate types
supabase gen types typescript --local > src/types/database.ts

# Reset local database
supabase db reset

# Stop local Supabase
supabase stop
```

### E. Database Schema Summary
**Total Tables:** 11
**Total Enums:** 8
**Total Indexes:** 12

**Key Relationships:**
- Campaigns → Campaign Targets (1:N)
- Campaigns → Activities (1:N)
- Campaigns → Proposals (1:N)
- Campaigns → Proformas (1:N)
- Campaigns → Tenders (1:N)
- Campaigns → Expenses (1:N)
- Campaigns → Market Insights (1:N)
- Proposals → Proposal Items (1:N)
- Proformas → Proforma Items (1:N)
- Products/Services → Proposal Items (1:N)
- Products/Services → Proforma Items (1:N)

---

## Implementation Timeline Estimate

- **Phase 1:** 1-2 days
- **Phase 2:** 1 day
- **Phase 3:** 2-3 days
- **Phase 4:** 5-7 days
- **Phase 5:** 3-4 days
- **Phase 6:** 4-5 days
- **Phase 7:** 3-4 days
- **Phase 8:** 1-2 days

**Total Estimated Time:** 20-28 days

---

## Success Criteria

✅ All database tables created and migrated
✅ Authentication flow working
✅ All MVP modules functional (Campaigns, Activities, Proposals, Tenders)
✅ Financial modules operational (Proformas, Expenses, Products)
✅ Role-based dashboards displaying correct data
✅ Real-time data synchronization with Supabase
✅ Responsive design working on all devices
✅ All forms validated and error-free
✅ File uploads working for documents
✅ Budget vs actual tracking accurate
✅ ROI calculations correct
✅ Application deployed and accessible
✅ Performance optimized (load time < 3s)
✅ Security measures in place (RLS, input validation)
✅ Documentation complete

---

## Notes

- This implementation plan assumes a single developer working full-time
- Adjust timeline based on team size and experience
- Prioritize MVP modules (Phase 4) for initial release
- Add features incrementally based on user feedback
- Regular testing after each phase is recommended
- Maintain close communication with stakeholders
- Be prepared to adjust based on changing requirements
