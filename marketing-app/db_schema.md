# Campaigns
- id
- owner id
- name
- description
- status: planned, active, completed, on_hold, archived
- start date
- end date
- budget estimated
- notes

# Campaign Targets
- id
- campaign id
- metric: leads, conversions, revenue, impressions, engagement
- target value
- actual value
- target date

# Activities
- id
- campaign id
- title
- type: content_production, social_media, website, paid_ad, visit, meeting, demo, event, follow_up, other
- status: planned, in_progress, completed, overdue
- scheduled start
- scheduled end
- completed at
- assigned to
- location
- notes

# Products Services
- id
- name
- description
- type: product, service
- category
- unit cost
- unit price
- sku

# Proposals
- id
- campaign id
- owner id
- client name
- client email
- amount
- status: draft, submitted, follow_up, accepted, rejected, on_hold
- submitted at
- follow up at
- accepted at
- file url(s)
- notes

# Proposal Items
- id
- proposal id
- product service id
- description
- quantity
- unit price
- total

# Proformas
- id
- campaign id
- owner id
- client name
- client email
- amount
- status: requested, submitted, follow_up, accepted, rejected, on_hold
- requested at
- submitted at
- accepted at
- file url(s)
- notes

# Proforma Items
- id
- proforma id
- product service id
- description
- quantity
- unit price
- total

# Tenders
- id
- campaign id
- owner id
- title
- client name
- amount
- status: opportunity, preparation, submitted, follow_up, awarded, lost, on_hold
- deadline
- submitted at
- awarded at
- file url(s)
- notes

# Expenses
- id
- campaign id
- category: advertising, content, events, travel, software, personnel, other
- description
- amount
- expense date
- receipt url
- submitted by
- approved by
- approval status: pending, approved, rejected

# Market Insights
- id
- campaign id
- type: customer_need, competitor, market_trend, new_opportunity
- title
- description
- source
- date identified
- relevance score: 1 - 10
