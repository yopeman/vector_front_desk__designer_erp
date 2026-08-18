import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layouts/DashboardLayout'
import AuthLayout from './components/layouts/AuthLayout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import Home from './pages/Home'
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
          <Route path="/login" element={<PlaceholderPage title="Login" />} />
          <Route path="/register" element={<PlaceholderPage title="Register" />} />
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
          <Route path="/campaigns" element={<PlaceholderPage title="Campaigns" />} />
          <Route path="/activities" element={<PlaceholderPage title="Activities" />} />
          <Route path="/proposals" element={<PlaceholderPage title="Proposals" />} />
          <Route path="/proformas" element={<PlaceholderPage title="Proformas" />} />
          <Route path="/tenders" element={<PlaceholderPage title="Tenders" />} />
          <Route path="/expenses" element={<PlaceholderPage title="Expenses" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
