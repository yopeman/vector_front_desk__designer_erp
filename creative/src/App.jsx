import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { CreativeAuthProvider, useCreativeAuth } from './contexts/CreativeAuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DashboardTab from './components/DashboardTab'
import PrototypeTab from './components/PrototypeTab'
import IdeaTab from './components/IdeaTab'
import DesignTab from './components/DesignTab'
import LeaveTab from './components/LeaveTab'
import CreativeChat from './components/CreativeChat'
import CreativeLogin from './components/CreativeLogin'
import ResignationTab from './components/ResignationTab'
import ExperienceTab from './components/ExperienceTab'
import TransferTab from './components/TransferTab'
import PromotionTab from './components/PromotionTab'
import HireTab from './components/HireTab'
import BudgetTab from './components/BudgetTab'
import OtherTab from './components/OtherTab'
import NotesTab from './components/NotesTab'
import ReportsTab from './components/ReportsTab'
import NotificationsTab from './components/NotificationsTab'
import SettingsTab from './components/SettingsTab'
import './index.css'

function CreativeApp() {
  const [activeTab, setActiveTab] = useState('dashboardTab')
  const [searchQuery, setSearchQuery] = useState('')
  const [counts, setCounts] = useState({
    prototypes: 0,
    ideas: 0,
    designs: 0,
    leaves: 0
  })
  const { isCreativeAdmin } = useCreativeAuth()

  useEffect(() => {
    fetchDashboardCounts()
  }, [])

  const fetchDashboardCounts = async () => {
    try {
      const [protoCount, ideaCount, designCount, leaveCount] = await Promise.all([
        supabase.from('crt_prototype_requests').select('*', { count: 'exact', head: true }),
        supabase.from('crt_idea_hub').select('*', { count: 'exact', head: true }),
        supabase.from('crt_design_bom').select('*', { count: 'exact', head: true }),
        supabase.from('crt_staff_leaves').select('*', { count: 'exact', head: true })
      ])

      setCounts({
        prototypes: protoCount.count || 0,
        ideas: ideaCount.count || 0,
        designs: designCount.count || 0,
        leaves: leaveCount.count || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard counts:', error)
    }
  }

  const handleTabSwitch = (tabId) => {
    console.log('Switching to tab:', tabId)
    setActiveTab(tabId)
    setSearchQuery('')
    // Refresh counts when switching tabs
    fetchDashboardCounts()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 text-slate-800 antialiased">
      <Sidebar activeTab={activeTab} onTabSwitch={handleTabSwitch} />
      
      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
        <Header onTabSwitch={handleTabSwitch} />
        
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto flex-1">
          <DashboardTab 
            isActive={activeTab === 'dashboardTab'} 
            onTabSwitch={handleTabSwitch}
            prototypeCount={counts.prototypes}
            ideaCount={counts.ideas}
            designCount={counts.designs}
            leaveCount={counts.leaves}
          />
          <PrototypeTab isActive={activeTab === 'prototypeTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <IdeaTab isActive={activeTab === 'ideaTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <DesignTab isActive={activeTab === 'designTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <LeaveTab isActive={activeTab === 'leaveTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <CreativeChat isActive={activeTab === 'messagesTab'} />
          <ResignationTab isActive={activeTab === 'resignationTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <ExperienceTab isActive={activeTab === 'experienceTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <TransferTab isActive={activeTab === 'transferTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <PromotionTab isActive={activeTab === 'promotionTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <HireTab isActive={activeTab === 'hireTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <BudgetTab isActive={activeTab === 'budgetTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <OtherTab isActive={activeTab === 'otherTab'} searchQuery={searchQuery} onDataChange={fetchDashboardCounts} />
          <ReportsTab isActive={activeTab === 'reportsTab'} searchQuery={searchQuery} />
          <NotesTab isActive={activeTab === 'notesTab'} searchQuery={searchQuery} />
          <NotificationsTab isActive={activeTab === 'notificationsTab'} />
          <SettingsTab isActive={activeTab === 'settingsTab'} />
        </div>
        
      </main>
    </div>
  )
}

function App() {
  const { loading, isAuthenticated } = useCreativeAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <CreativeLogin />
  }

  return <CreativeApp />
}

export default App