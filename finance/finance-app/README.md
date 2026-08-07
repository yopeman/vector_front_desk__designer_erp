# Finance ERP Module

A standalone React Single Page Application for managing financial operations, integrating with HR, Store, and Frontdesk Supabase databases.

## Features

- **Dashboard**: Overview of financial KPIs (purchases, sales, payroll, cash flow)
- **Purchases**: Sync purchase records from Store module with deduplication
- **Sales**: Sync sales records from Frontdesk module with deduplication
- **Chart of Accounts**: Manage general ledger accounts
- **Inventory**: Read-only view of stock items from Store module
- **General Journal**: Create and manage journal entries with debit/credit validation
- **Payroll**: Generate payroll with Ethiopian progressive tax calculator
- **Reports**: Generate financial reports (Income Statement, Balance Sheet, Trial Balance)

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Supabase JS SDK
- React Router v6
- React Query (@tanstack/react-query)
- React Hook Form
- Zod
- Lucide React
- react-hot-toast

## Architecture

- **Standalone SPA**: No backend, direct Supabase access with RLS
- **Database**: Finance schema migrated into Frontdesk Supabase database
- **External Databases**: HR, Store, Frontdesk accessed read-only for sync
- **Sync Logic**: Store → Purchases, Frontdesk → Sales, HR → Payroll
- **Deduplication**: `finance_sync_log` table prevents duplicate syncs

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FINANCE_URL=https://your-finance-supabase-url.supabase.co
VITE_FINANCE_ANON_KEY=your-finance-anon-key
VITE_HR_URL=https://your-hr-supabase-url.supabase.co
VITE_HR_ANON_KEY=your-hr-anon-key
VITE_STORE_URL=https://your-store-supabase-url.supabase.co
VITE_STORE_ANON_KEY=your-store-anon-key
VITE_FRONTDESK_URL=https://your-frontdesk-supabase-url.supabase.co
VITE_FRONTDESK_ANON_KEY=your-frontdesk-anon-key
```

### 3. Run Database Migration

Execute the SQL migration script in your Frontdesk Supabase database:

```bash
# Run the migration script in Supabase SQL Editor
# File: ../finance_migration.sql
```

This will create:
- `finance` schema with all tables
- `finance_sync_log` table for deduplication
- RLS policies
- Sample GL accounts

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
npm run preview
```

## Ethiopian Progressive Tax Calculator

The Payroll module includes a built-in progressive tax calculator following Ethiopian tax brackets:

| Taxable Salary Range | Rate |
|---------------------|------|
| 0 - 6,000 ETB | 0% |
| 6,001 - 16,500 ETB | 10% |
| 16,501 - 32,000 ETB | 15% |
| 32,001 - 52,500 ETB | 20% |
| 52,501 - 77,000 ETB | 25% |
| 77,001 - 109,500 ETB | 30% |
| 109,501+ ETB | 35% |

**Pension Calculations:**
- Employee: 7% of basic salary
- Employer: 11% of basic salary

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── DataTable.tsx
│   ├── StatCard.tsx
│   └── SyncButton.tsx
├── hooks/           # React Query hooks
│   ├── useFinance.ts
│   └── useSync.ts
├── layouts/         # Layout components
│   └── MainLayout.tsx
├── pages/           # Page components
│   ├── Dashboard.tsx
│   ├── Purchases.tsx
│   ├── Sales.tsx
│   ├── ChartOfAccounts.tsx
│   ├── Inventory.tsx
│   ├── GeneralJournal.tsx
│   ├── Payroll.tsx
│   └── Reports.tsx
├── services/        # External services
│   ├── supabaseClients.ts
│   └── syncService.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── App.jsx          # Main app component
├── index.css        # Tailwind CSS imports
└── vite-env.d.ts    # Vite environment types
```

## Security

- Row Level Security (RLS) enabled on all tables
- No hardcoded API keys (use environment variables)
- Input validation with Zod
- Read-only access to external databases (HR, Store, Frontdesk)
- Write access only to Finance schema

## Sync Operations

### Store → Purchases
- Fetches Goods Receiving Vouchers (GRVs) with status "Received"
- Creates purchase records with items
- Logs sync attempts to prevent duplicates

### Frontdesk → Sales
- Fetches invoices with status "Paid" or "Approved"
- Creates sales records with order items
- Logs sync attempts to prevent duplicates

### HR → Payroll
- Fetches active employees and approved overtime records
- Calculates gross salary, tax, pension, and net pay
- Generates payroll records for selected period
- Logs sync attempts to prevent duplicates

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `src/layouts/MainLayout.tsx`

### Adding New Hooks

1. Create hook in `src/hooks/useFinance.ts` or `src/hooks/useSync.ts`
2. Use React Query for data fetching and mutations
3. Include proper error handling

## License

Proprietary - Vector Advert
