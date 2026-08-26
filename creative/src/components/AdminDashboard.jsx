import React from 'react'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'

const AdminDashboard = ({ isActive, onTabSwitch, prototypeCount, ideaCount, designCount, leaveCount }) => {
  const { user } = useCreativeAuth()

  if (!isActive) return null

  const adminStats = [
    { label: 'Total Prototypes', value: prototypeCount, icon: 'fa-flask', color: 'primary', onClick: () => onTabSwitch('prototypeTab') },
    { label: 'Total Ideas', value: ideaCount, icon: 'fa-lightbulb', color: 'primary', onClick: () => onTabSwitch('ideaTab') },
    { label: 'Design Projects', value: designCount, icon: 'fa-compass-drafting', color: 'primary', onClick: () => onTabSwitch('designTab') },
    { label: 'Leave Requests', value: leaveCount, icon: 'fa-user-clock', color: 'primary', onClick: () => onTabSwitch('leaveTab') },
  ]

  const adminActions = [
    { label: 'Review Prototypes', icon: 'fa-flask', color: 'primary', onClick: () => onTabSwitch('prototypeTab') },
    { label: 'Approve Ideas', icon: 'fa-lightbulb', color: 'primary', onClick: () => onTabSwitch('ideaTab') },
    { label: 'Manage Designs', icon: 'fa-compass-drafting', color: 'primary', onClick: () => onTabSwitch('designTab') },
    { label: 'Approve Leaves', icon: 'fa-calendar-check', color: 'primary', onClick: () => onTabSwitch('leaveTab') },
    { label: 'View Reports', icon: 'fa-chart-bar', color: 'primary', onClick: () => onTabSwitch('reportsTab') },
    { label: 'Manage Users', icon: 'fa-users-gear', color: 'primary', onClick: () => alert('User management coming soon') },
  ]

  const recentActivity = [
    { type: 'Prototype', description: 'New request REQ-0950 submitted', time: '2 hours ago', status: 'Pending' },
    { type: 'Idea', description: 'Idea IDEA-225 approved', time: '4 hours ago', status: 'Approved' },
    { type: 'Design', description: 'DSGN-884 updated', time: '6 hours ago', status: 'Updated' },
    { type: 'Leave', description: 'Leave request LEAVE-05 pending', time: '8 hours ago', status: 'Pending' },
  ]

  return (
    <div className="tab-content active space-y-8">
      {/* Admin Welcome Section */}
      <div className="relative rounded-3xl p-8 bg-gradient-to-r from-primary-900 to-primary-800 text-white overflow-hidden shadow-xl border border-primary-700">
        <div className="absolute -right-10 -bottom-10 text-[180px] text-primary-700/30 font-bold pointer-events-none select-none">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider border border-primary-500/30">
            <i className="fa-solid fa-crown mr-2"></i>Administrator Dashboard
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-3">Welcome, Creative Admin</h2>
          <p className="text-primary-100 text-sm mt-2 leading-relaxed">
            You have full control over the creative section. Manage prototypes, approve ideas, oversee designs, and handle leave requests.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-xl">
              <p className="text-primary-400 text-xs font-semibold">
                <i className="fa-solid fa-check-circle mr-2"></i>System Operational
              </p>
            </div>
            <div className="px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-xl">
              <p className="text-primary-400 text-xs font-semibold">
                <i className="fa-solid fa-user mr-2"></i>{user?.email || 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {adminStats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
            </div>
            <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl group-hover:bg-${stat.color}-600 group-hover:text-white transition`}>
              <i className={`fa-solid ${stat.icon} text-lg`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Quick Actions */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          <i className="fa-solid fa-bolt text-primary-500 mr-2"></i>Admin Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {adminActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 font-semibold text-xs text-slate-600 transition text-center space-y-2"
            >
              <i className={`fa-solid ${action.icon} text-lg block text-${action.color}-500`}></i>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          <i className="fa-solid fa-clock-rotate-left text-primary-500 mr-2"></i>Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'Prototype' ? 'bg-primary-100 text-primary-600' :
                  activity.type === 'Idea' ? 'bg-primary-100 text-primary-600' :
                  activity.type === 'Design' ? 'bg-primary-100 text-primary-600' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  <i className={`fa-solid ${
                    activity.type === 'Prototype' ? 'fa-flask' :
                    activity.type === 'Idea' ? 'fa-lightbulb' :
                    activity.type === 'Design' ? 'fa-compass-drafting' :
                    'fa-calendar-check'
                  }`}></i>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{activity.type}: {activity.description}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                activity.status === 'Approved' ? 'bg-primary-100 text-primary-600' :
                activity.status === 'Pending' ? 'bg-primary-100 text-primary-600' :
                'bg-primary-100 text-primary-600'
              }`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base">
            <i className="fa-solid fa-chart-pie text-primary-500 mr-2"></i>Approval Overview
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pending Approvals</span>
              <span className="text-sm font-bold text-primary-600">8</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Approved This Week</span>
              <span className="text-sm font-bold text-primary-600">15</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base">
            <i className="fa-solid fa-users text-primary-500 mr-2"></i>User Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active Users Today</span>
              <span className="text-sm font-bold text-primary-600">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">New Submissions</span>
              <span className="text-sm font-bold text-primary-600">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Completed Tasks</span>
              <span className="text-sm font-bold text-primary-600">23</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard