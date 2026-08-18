import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layouts/DashboardLayout'
import AuthLayout from './components/layouts/AuthLayout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Campaigns from './pages/Campaigns/index'
import Activities from './pages/Activities/index'
import Proposals from './pages/Proposals/index'
import Proformas from './pages/Proformas/index'
import Tenders from './pages/Tenders/index'
import Expenses from './pages/Expenses/index'
import Products from './pages/Products/index'
import NotFound from './pages/NotFound'

// Placeholder pages for routes
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
          <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/proformas" element={<Proformas />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/products" element={<Products />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
