import React from 'react'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'
import Notifications from './Notifications'

const Header = ({ onTabSwitch }) => {
  const { user, logout, isCreativeAdmin } = useCreativeAuth()

  return (
    <header className="bg-white border-b border-primary-100 h-16 flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-800">Creative Product Development</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold border border-slate-700">
              {user?.email?.charAt(0).toUpperCase() || 'C'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{user?.email || 'creative@admin.com'}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-500">Active Session</p>
              {isCreativeAdmin && (
                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-600 rounded-full text-[10px] font-bold uppercase">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 text-slate-300 rounded-lg transition text-xs font-semibold"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          Sign Out
        </button>
        <Notifications onTabSwitch={onTabSwitch} />
      </div>
    </header>
  )
}

export default Header