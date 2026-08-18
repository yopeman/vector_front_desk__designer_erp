import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layouts/DashboardLayout'
import AuthLayout from './components/layouts/AuthLayout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// Marketing Plan
import PlanDashboard from './pages/Plan/Dashboard'
import PlanCalendar from './pages/Plan/Calendar'
import PlanTargets from './pages/Plan/Targets'

// Campaigns
import Campaigns from './pages/Campaigns/index'

// Digital & Physical Marketing
import Digital from './pages/Digital/index'
import DigitalPerformance from './pages/Digital/Performance'
import Physical from './pages/Physical/index'

// Proposals / Proformas / Tenders
import Proposals from './pages/Proposals/index'
import Proformas from './pages/Proformas/index'
import Tenders from './pages/Tenders/index'

// Products
import Products from './pages/Products/index'
import ProductPromotions from './pages/Products/Promotions'
import ProductPerformance from './pages/Products/Performance'

// Market Research
import MarketResearch from './pages/MarketResearch/index'

// Marketing Costs
import BudgetOverview from './pages/Costs/index'
import CostsExpenses from './pages/Costs/Expenses'
import CampaignCosts from './pages/Costs/CampaignCosts'
import BudgetVsActual from './pages/Costs/BudgetVsActual'

// Marketing Tasks
import Tasks from './pages/Tasks/index'

// Marketing Analysis
import Kpis from './pages/Analysis/Kpis'
import LeadConversion from './pages/Analysis/LeadConversion'
import DigitalPerfAnalysis from './pages/Analysis/DigitalPerformance'
import PhysicalPerfAnalysis from './pages/Analysis/PhysicalPerformance'
import ProposalFunnel from './pages/Analysis/ProposalFunnel'
import CostsRoi from './pages/Analysis/CostsRoi'
import Monthly from './pages/Analysis/Monthly'

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-600">Coming soon</p>
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes with DashboardLayout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Marketing Plan */}
          <Route path="/plan" element={<PlanDashboard />} />
          <Route path="/plan/calendar" element={<PlanCalendar />} />
          <Route path="/plan/targets" element={<PlanTargets />} />

          {/* Campaigns */}
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:filter" element={<Campaigns />} />

          {/* Digital Marketing */}
          <Route path="/digital" element={<Digital />} />
          <Route path="/digital/performance" element={<DigitalPerformance />} />
          <Route path="/digital/:filter" element={<Digital />} />

          {/* Physical Marketing */}
          <Route path="/physical" element={<Physical />} />
          <Route path="/physical/:filter" element={<Physical />} />

          {/* Proposals / Proformas / Tenders */}
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/proposals/:filter" element={<Proposals />} />
          <Route path="/proformas" element={<Proformas />} />
          <Route path="/proformas/:filter" element={<Proformas />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/tenders/:filter" element={<Tenders />} />

          {/* Products */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/promotions" element={<ProductPromotions />} />
          <Route path="/products/performance" element={<ProductPerformance />} />
          <Route path="/products/:filter" element={<Products />} />

          {/* Market Research */}
          <Route path="/market-research" element={<MarketResearch />} />
          <Route path="/market-research/:filter" element={<MarketResearch />} />

          {/* Marketing Costs */}
          <Route path="/costs" element={<BudgetOverview />} />
          <Route path="/costs/expenses" element={<CostsExpenses />} />
          <Route path="/costs/campaign-costs" element={<CampaignCosts />} />
          <Route path="/costs/budget-vs-actual" element={<BudgetVsActual />} />

          {/* Marketing Tasks */}
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:filter" element={<Tasks />} />

          {/* Marketing Analysis */}
          <Route path="/analysis/kpis" element={<Kpis />} />
          <Route path="/analysis/lead-conversion" element={<LeadConversion />} />
          <Route path="/analysis/digital-performance" element={<DigitalPerfAnalysis />} />
          <Route path="/analysis/physical-performance" element={<PhysicalPerfAnalysis />} />
          <Route path="/analysis/proposal-funnel" element={<ProposalFunnel />} />
          <Route path="/analysis/costs-roi" element={<CostsRoi />} />
          <Route path="/analysis/monthly" element={<Monthly />} />

          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
