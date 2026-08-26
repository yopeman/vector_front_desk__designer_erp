import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'

const DashboardTab = ({ isActive, onTabSwitch, prototypeCount, ideaCount, designCount, leaveCount }) => {
  const { isCreativeAdmin } = useCreativeAuth()
  const [workflowStats, setWorkflowStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
    onProgress: 0
  })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    if (isActive) {
      fetchWorkflowStats()
      fetchRecentActivity()
    }
  }, [isActive])

  const fetchWorkflowStats = async () => {
    try {
      // Fetch status counts from all tables
      const [prototypes, ideas, designs, leaves] = await Promise.all([
        supabase.from('prototype_requests').select('status'),
        supabase.from('idea_hub').select('status'),
        supabase.from('design_bom').select('status'),
        supabase.from('staff_leaves').select('status')
      ])

      const countStatus = (data, status) => data?.filter(item => item.status === status)?.length || 0

      const stats = {
        pending: countStatus(prototypes.data, 'Pending') + countStatus(ideas.data, 'Pending') + countStatus(designs.data, 'Pending') + countStatus(leaves.data, 'Pending'),
        approved: countStatus(prototypes.data, 'Approved') + countStatus(ideas.data, 'Approved') + countStatus(designs.data, 'Approved') + countStatus(leaves.data, 'Approved'),
        rejected: countStatus(prototypes.data, 'Rejected') + countStatus(ideas.data, 'Rejected') + countStatus(designs.data, 'Rejected') + countStatus(leaves.data, 'Rejected'),
        underReview: countStatus(prototypes.data, 'Under Review') + countStatus(ideas.data, 'Under Review') + countStatus(designs.data, 'Under Review') + countStatus(leaves.data, 'Under Review'),
        onProgress: countStatus(prototypes.data, 'On Progress') + countStatus(designs.data, 'On Progress')
      }

      setWorkflowStats(stats)
    } catch (error) {
      console.error('Error fetching workflow stats:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent items from all tables
      const [prototypes, ideas, designs, leaves] = await Promise.all([
        supabase.from('prototype_requests').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('idea_hub').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('design_bom').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('staff_leaves').select('*').order('created_at', { ascending: false }).limit(3)
      ])

      const allActivity = [
        ...(prototypes.data || []).map(item => ({ ...item, type: 'Prototype', icon: 'fa-flask', color: 'primary' })),
        ...(ideas.data || []).map(item => ({ ...item, type: 'Idea', icon: 'fa-lightbulb', color: 'primary' })),
        ...(designs.data || []).map(item => ({ ...item, type: 'Design', icon: 'fa-compass-drafting', color: 'primary' })),
        ...(leaves.data || []).map(item => ({ ...item, type: 'Leave', icon: 'fa-calendar-minus', color: 'primary' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)

      setRecentActivity(allActivity)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }
  
  if (!isActive) return null

  return (
    <div className="tab-content active space-y-6">
      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Presence Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Presence</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">clocked in:</span>
              <span className="text-sm font-mono font-bold text-slate-700">00:00:00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">clocked out:</span>
              <span className="text-sm font-mono font-bold text-slate-700">00:00:00</span>
            </div>
          </div>
        </div>

        {/* 2. Idea Status Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Idea Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Ideas Submitted:</span>
              <span className="text-sm font-bold text-slate-700">{ideaCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">under review:</span>
              <span className="text-sm font-bold text-primary-600">{workflowStats.underReview}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">aproved:</span>
              <span className="text-sm font-bold text-primary-600">{workflowStats.approved}</span>
            </div>
          </div>
        </div>

        {/* 3. Prototype Status Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">prototype status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">on progress:</span>
              <span className="text-sm font-bold text-primary-600">{workflowStats.onProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">ready for launch:</span>
              <span className="text-sm font-bold text-primary-600">{workflowStats.approved}</span>
            </div>
          </div>
        </div>

        {/* 4. Message Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">message</h3>
          <div className="bg-slate-50 rounded-xl p-4 min-h-[80px] flex items-center justify-center">
            <span className="text-xs text-slate-400">Message Area / Placeholder Box</span>
          </div>
        </div>
      </div>

      {/* Workflow Statistics */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-4">
          <i className="fa-solid fa-chart-pie text-primary-500 mr-2"></i>Workflow Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 text-center">
            <p className="text-2xl font-bold text-primary-600">{workflowStats.pending}</p>
            <p className="text-xs text-primary-700 font-semibold">Pending</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 text-center">
            <p className="text-2xl font-bold text-primary-600">{workflowStats.underReview}</p>
            <p className="text-xs text-primary-700 font-semibold">Under Review</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 text-center">
            <p className="text-2xl font-bold text-primary-600">{workflowStats.onProgress}</p>
            <p className="text-xs text-primary-700 font-semibold">On Progress</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 text-center">
            <p className="text-2xl font-bold text-primary-600">{workflowStats.approved}</p>
            <p className="text-xs text-primary-700 font-semibold">Approved</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 text-center">
            <p className="text-2xl font-bold text-primary-600">{workflowStats.rejected}</p>
            <p className="text-xs text-primary-700 font-semibold">Rejected</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4">
          <i className="fa-solid fa-bolt text-primary-500 mr-2"></i>Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onTabSwitch('prototypeTab')}
            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 font-semibold text-xs text-slate-600 transition text-center space-y-2"
          >
            <i className="fa-solid fa-flask text-lg block text-primary-500"></i>
            <span>New Prototype</span>
          </button>
          <button
            onClick={() => onTabSwitch('ideaTab')}
            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 font-semibold text-xs text-slate-600 transition text-center space-y-2"
          >
            <i className="fa-solid fa-lightbulb text-lg block text-primary-500"></i>
            <span>Register Idea</span>
          </button>
          <button
            onClick={() => onTabSwitch('designTab')}
            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 font-semibold text-xs text-slate-600 transition text-center space-y-2"
          >
            <i className="fa-solid fa-compass-drafting text-lg block text-primary-500"></i>
            <span>Add Design</span>
          </button>
          <button
            onClick={() => onTabSwitch('leaveTab')}
            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 font-semibold text-xs text-slate-600 transition text-center space-y-2"
          >
            <i className="fa-solid fa-calendar-minus text-lg block text-primary-500"></i>
            <span>Request Leave</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4">
          <i className="fa-solid fa-clock-rotate text-primary-500 mr-2"></i>Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-primary-100 text-primary-600`}>
                    <i className={`fa-solid ${activity.icon}`}></i>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{activity.type}</p>
                    <p className="text-xs text-slate-500">
                      {activity.request_number || activity.idea_code || activity.design_reference || activity.leave_id || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-600`}>
                    {activity.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardTab