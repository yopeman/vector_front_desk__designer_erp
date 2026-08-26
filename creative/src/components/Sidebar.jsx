import React, { useState } from 'react'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'

const Sidebar = ({ activeTab, onTabSwitch }) => {
  const { user, logout, isCreativeAdmin } = useCreativeAuth()
  const [requestDropdownOpen, setRequestDropdownOpen] = useState(false)
  
  const tabs = [
    { id: 'dashboardTab', label: 'Dashboard', icon: 'fa-table-columns', color: 'text-primary-400' },
    { id: 'prototypeTab', label: 'Prototype Request', icon: 'fa-flask', color: 'text-primary-400' },
    { id: 'ideaTab', label: 'Idea', icon: 'fa-lightbulb', color: 'text-primary-400' },
    { id: 'designTab', label: 'Design Log', icon: 'fa-compass-drafting', color: 'text-primary-400' },
    { id: 'reportsTab', label: 'Reports', icon: 'fa-chart-bar', color: 'text-primary-400' },
    { id: 'messagesTab', label: 'Message', icon: 'fa-envelope', color: 'text-primary-400' },
    { id: 'notificationsTab', label: 'Notifications', icon: 'fa-bell', color: 'text-primary-400' },
    { id: 'notesTab', label: 'Notes', icon: 'fa-sticky-note', color: 'text-primary-400' },
    { id: 'settingsTab', label: 'Settings', icon: 'fa-gear', color: 'text-primary-400' },
  ]
  
  const requestSubCategories = [
    { id: 'leaveTab', label: 'Leave', icon: 'fa-calendar-minus' },
    { id: 'resignationTab', label: 'Letter of resignation', icon: 'fa-file-signature' },
    { id: 'experienceTab', label: 'Letter of experience', icon: 'fa-file-lines' },
    { id: 'transferTab', label: 'Letter of transfer', icon: 'fa-right-left' },
    { id: 'promotionTab', label: 'Letter of promotion', icon: 'fa-arrow-up' },
    { id: 'hireTab', label: 'Letter of Hire', icon: 'fa-user-plus' },
    { id: 'budgetTab', label: 'Budget & Expenses', icon: 'fa-money-bill' },
    { id: 'otherTab', label: 'Other', icon: 'fa-ellipsis' },
  ]

  return (
    <aside className="w-68 bg-primary-900 text-slate-200 flex flex-col justify-between hidden md:flex z-10 shadow-2xl shrink-0">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-primary-800 bg-primary-950/40">
          <div className="bg-gradient-to-tr from-primary-500 to-primary-600 p-2.5 rounded-xl text-white shadow-md shadow-primary-500/20">
            <i className="fa-solid fa-cubes text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white tracking-wide">V☰CTOR A&M</h1>
            <span className="text-xs text-primary-400 font-semibold tracking-wider uppercase">ERP Premium v2.0</span>
          </div>
        </div>

        <div className="p-4 pt-6 text-xs font-bold text-slate-500 uppercase tracking-widest px-6">Main Modules</div>
        <nav className="p-4 space-y-1.5 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                console.log('Sidebar button clicked:', tab.id)
                onTabSwitch(tab.id)
              }}
              className={`tab-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-600/10'
                  : 'text-slate-400 hover:bg-primary-800 hover:text-slate-100'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-base ${tab.color || ''}`}></i>
              {tab.label}
            </button>
          ))}
          
          {/* Request Dropdown */}
          {/* <div className="relative">
            <button
              onClick={() => setRequestDropdownOpen(!requestDropdownOpen)}
              className={`w-full flex items-center justify-between gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left ${
                requestDropdownOpen || requestSubCategories.some(cat => activeTab === cat.id)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-600/10'
                  : 'text-slate-400 hover:bg-primary-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <i className="fa-solid fa-file-lines text-base text-primary-400"></i>
                <span>Request</span>
              </div>
              <i className={`fa-solid fa-chevron-down text-xs transition-transform ${requestDropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>
            
            {requestDropdownOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {requestSubCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      onTabSwitch(category.id)
                      setRequestDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition text-left text-xs ${
                      activeTab === category.id
                        ? 'bg-primary-500/30 text-primary-300'
                        : 'text-slate-500 hover:bg-primary-800 hover:text-slate-300'
                    }`}
                  >
                    <i className={`fa-solid ${category.icon} text-sm`}></i>
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div> */}

            <button
              onClick={() => window.open('https://vectoradvert.com/erp/hr', '_self')}
              className={`w-full flex items-center justify-between gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left ${
                requestDropdownOpen || requestSubCategories.some(cat => activeTab === cat.id)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-600/10'
                  : 'text-slate-400 hover:bg-primary-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <i className="fa-solid fa-file-lines text-base text-primary-400"></i>
                <span>HR Request</span>
              </div>
            </button>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar