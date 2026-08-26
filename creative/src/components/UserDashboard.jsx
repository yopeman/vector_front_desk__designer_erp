import React from 'react'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'

const UserDashboard = ({ isActive, onTabSwitch, prototypeCount, ideaCount, designCount, leaveCount }) => {
  const { user } = useCreativeAuth()

  if (!isActive) return null

  const userStats = [
    { label: 'My Prototypes', value: prototypeCount, icon: 'fa-flask', color: 'primary', onClick: () => onTabSwitch('prototypeTab') },
    { label: 'My Ideas', value: ideaCount, icon: 'fa-lightbulb', color: 'primary', onClick: () => onTabSwitch('ideaTab') },
    { label: 'My Designs', value: designCount, icon: 'fa-compass-drafting', color: 'primary', onClick: () => onTabSwitch('designTab') },
    { label: 'My Leaves', value: leaveCount, icon: 'fa-user-clock', color: 'primary', onClick: () => onTabSwitch('leaveTab') },
  ]

  const userActions = [
    { label: 'Submit Prototype', icon: 'fa-flask', color: 'primary', onClick: () => onTabSwitch('prototypeTab') },
    { label: 'Share Idea', icon: 'fa-lightbulb', color: 'primary', onClick: () => onTabSwitch('ideaTab') },
    { label: 'Add Design', icon: 'fa-compass-drafting', color: 'primary', onClick: () => onTabSwitch('designTab') },
    { label: 'Request Leave', icon: 'fa-calendar-minus', color: 'primary', onClick: () => onTabSwitch('leaveTab') },
    { label: 'My Messages', icon: 'fa-envelope', color: 'primary', onClick: () => onTabSwitch('messagesTab') },
    { label: 'My Notes', icon: 'fa-sticky-note', color: 'primary', onClick: () => onTabSwitch('notesTab') },
  ]

  const mySubmissions = [
    { type: 'Prototype', id: 'REQ-0948', description: 'Custom sign mockup', status: 'Under Review', date: '2026-08-10' },
    { type: 'Idea', id: 'IDEA-223', description: 'LED profile system', status: 'Approved', date: '2026-08-08' },
    { type: 'Design', id: 'DSGN-882', description: 'Acrylic frame design', status: 'Ready', date: '2026-08-05' },
  ]

  return (
    <div className="tab-content active space-y-8">
      {/* User Welcome Section */}
      <div className="relative rounded-3xl p-8 bg-gradient-to-r from-primary-600 to-primary-500 text-white overflow-hidden shadow-xl border border-primary-500">
        <div className="absolute -right-10 -bottom-10 text-[180px] text-primary-700/30 font-bold pointer-events-none select-none">
          <i className="fa-solid fa-cubes"></i>
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
            <i className="fa-solid fa-user mr-2"></i>Creative Portal
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-3">Welcome to Creative Hub</h2>
          <p className="text-primary-100 text-sm mt-2 leading-relaxed">
            Submit your prototypes, share innovative ideas, manage design workflows, and request leave all in one place.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="px-4 py-2 bg-white/20 border border-white/30 rounded-xl">
              <p className="text-white text-xs font-semibold">
                <i className="fa-solid fa-check-circle mr-2"></i>Ready to Create
              </p>
            </div>
            <div className="px-4 py-2 bg-white/20 border border-white/30 rounded-xl">
              <p className="text-white text-xs font-semibold">
                <i className="fa-solid fa-user mr-2"></i>{user?.email || 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {userStats.map((stat, index) => (
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

      {/* User Quick Actions */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          <i className="fa-solid fa-rocket text-primary-500 mr-2"></i>Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {userActions.map((action, index) => (
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

      {/* My Recent Submissions */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          <i className="fa-solid fa-folder-open text-primary-500 mr-2"></i>My Recent Submissions
        </h3>
        <div className="space-y-3">
          {mySubmissions.map((submission, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  submission.type === 'Prototype' ? 'bg-primary-100 text-primary-600' :
                  submission.type === 'Idea' ? 'bg-primary-100 text-primary-600' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  <i className={`fa-solid ${
                    submission.type === 'Prototype' ? 'fa-flask' :
                    submission.type === 'Idea' ? 'fa-lightbulb' :
                    'fa-compass-drafting'
                  }`}></i>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{submission.type}: {submission.id}</p>
                  <p className="text-xs text-slate-500">{submission.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  submission.status === 'Approved' ? 'bg-primary-100 text-primary-600' :
                  submission.status === 'Under Review' ? 'bg-primary-100 text-primary-600' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  {submission.status}
                </span>
                <p className="text-xs text-slate-400 mt-1">{submission.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Helpful Tips */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 border border-primary-200 rounded-2xl space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          <i className="fa-solid fa-lightbulb text-primary-500 mr-2"></i>Tips for Better Submissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-primary-100">
            <h4 className="font-semibold text-slate-800 text-sm mb-2">
              <i className="fa-solid fa-flask text-primary-500 mr-2"></i>Prototypes
            </h4>
            <p className="text-xs text-slate-600">Include detailed specifications and deadlines for faster approval.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-primary-100">
            <h4 className="font-semibold text-slate-800 text-sm mb-2">
              <i className="fa-solid fa-lightbulb text-primary-500 mr-2"></i>Ideas
            </h4>
            <p className="text-xs text-slate-600">Explain the potential impact and estimated costs clearly.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-primary-100">
            <h4 className="font-semibold text-slate-800 text-sm mb-2">
              <i className="fa-solid fa-compass-drafting text-primary-500 mr-2"></i>Designs
            </h4>
            <p className="text-xs text-slate-600">Specify machine routes and BOM details accurately.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard