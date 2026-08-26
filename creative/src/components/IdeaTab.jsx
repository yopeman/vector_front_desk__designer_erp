import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'
import { notifyAdminNewIdea, notifyIdeaStatus } from '../lib/creativeNotificationService'

const IdeaTab = ({ isActive, searchQuery, onDataChange }) => {
  const { isCreativeAdmin, user } = useCreativeAuth()
  const [ideas, setIdeas] = useState([
    {
      id: 1,
      idea_date: '2026-06-14',
      idea_number: 'IDEA-224',
      idea_title: 'Modular LED Profile Box',
      idea_source: 'staff',
      priority: 'normal',
      target_date: '2026-07-02',
      estimated_cost: 12500,
      status: 'Approved'
    }
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    idea_number: '',
    idea_title: '',
    idea_source: 'staff',
    priority: 'normal',
    discription: '',
    cost_estimation: '',
    dead_line_date_time: '',
    attached_file: null,
    attached_file_url: ''
  })
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (isActive) {
      fetchIdeas()
    }
  }, [isActive])

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('crt_idea_hub')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching ideas:', error)
        // Show sample data if table doesn't exist
        setIdeas([
          {
            id: 1,
            idea_date: '2026-06-14',
            idea_number: 'IDEA-224',
            idea_title: 'Modular LED Profile Box',
            idea_source: 'staff',
            priority: 'normal',
            target_date: '2026-07-02',
            estimated_cost: 12500,
            status: 'Approved'
          }
        ])
      } else {
        setIdeas(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      // Show sample data on any error
      setIdeas([
        {
          id: 1,
          idea_date: '2026-06-14',
          idea_number: 'IDEA-224',
          idea_title: 'Modular LED Profile Box',
          idea_source: 'staff',
          priority: 'normal',
          target_date: '2026-07-02',
          estimated_cost: 12500,
          status: 'Approved'
        }
      ])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if file data is too large for database
    if (formData.attached_file_url && formData.attached_file_url.length > 10000000) {
      alert('Attached file is too large. Please attach a smaller file (max 10MB).')
      return
    }
    
    const { data, error } = await supabase
      .from('crt_idea_hub')
      .insert([{
        idea_date: formData.date,
        idea_code: formData.idea_number,
        title: formData.idea_title,
        source: formData.idea_source,
        priority: formData.priority,
        target_date: formData.dead_line_date_time,
        estimated_cost: parseFloat(formData.cost_estimation) || 0,
        description: formData.discription,
        status: 'Pending',
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      }])
    
    if (error) {
      console.error('Error adding idea:', error)
      alert(`Error adding idea: ${error.message}`)
    } else {
      setIsModalOpen(false)
      setFormData({
        date: '',
        idea_number: '',
        idea_title: '',
        idea_source: 'staff',
        priority: 'normal',
        discription: '',
        cost_estimation: '',
        dead_line_date_time: '',
        attached_file: null,
        attached_file_url: ''
      })
      fetchIdeas()
      if (onDataChange) onDataChange()
      
      // Notify admins about new idea
      try {
        await notifyAdminNewIdea(data[0].id, formData.idea_title, user?.email || 'Unknown User')
        console.log('Idea notification sent successfully')
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }
      
      alert('Idea submitted successfully!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this idea?')) return
    
    const { error } = await supabase
      .from('crt_idea_hub')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting idea:', error)
      alert('Error deleting idea')
    } else {
      fetchIdeas()
      if (onDataChange) onDataChange()
      alert('Idea deleted successfully!')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    const { data, error } = await supabase
      .from('crt_idea_hub')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } else {
      fetchIdeas()
      if (onDataChange) onDataChange()
      
      // Notify user about status change
      try {
        const idea = data
        if (idea) {
          // Use the current user's ID for notification
          await notifyIdeaStatus(user.id, id, newStatus, idea.title)
          console.log('Idea status notification sent successfully')
        }
      } catch (notificationError) {
        console.error('Error sending status notification:', notificationError)
      }
      
      alert(`Status updated to ${newStatus}`)
    }
  }

  const handleViewDetails = async (idea) => {
    setSelectedIdea(idea)
    setIsDetailModalOpen(true)
  }

  const handleApproveWithDetails = async () => {
    await handleStatusUpdate(selectedIdea.id, 'Approved')
    setIsDetailModalOpen(false)
    setIsFileViewerOpen(false)
    setSelectedIdea(null)
  }

  const handleRejectWithDetails = async () => {
    await handleStatusUpdate(selectedIdea.id, 'Rejected')
    setIsDetailModalOpen(false)
    setIsFileViewerOpen(false)
    setSelectedIdea(null)
  }

  const handleEdit = (idea) => {
    setFormData({
      date: idea.idea_date,
      idea_number: idea.idea_code,
      idea_title: idea.title,
      idea_source: idea.source,
      priority: idea.priority,
      discription: idea.description || '',
      cost_estimation: idea.estimated_cost || '',
      dead_line_date_time: idea.target_date || '',
      attached_file: idea.attached_file || null,
      attached_file_url: idea.attached_file_url || ''
    })
    setEditingId(idea.id)
    setIsModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('crt_idea_hub')
      .update({
        idea_date: formData.date,
        idea_code: formData.idea_number,
        title: formData.idea_title,
        source: formData.idea_source,
        priority: formData.priority,
        target_date: formData.dead_line_date_time,
        estimated_cost: parseFloat(formData.cost_estimation) || 0,
        description: formData.discription,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      })
      .eq('id', editingId)
    
    if (error) {
      console.error('Error updating idea:', error)
      alert('Error updating idea')
    } else {
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({
        date: '',
        idea_number: '',
        idea_title: '',
        idea_source: 'staff',
        priority: 'normal',
        discription: '',
        cost_estimation: '',
        dead_line_date_time: '',
        attached_file: null,
        attached_file_url: ''
      })
      fetchIdeas()
      if (onDataChange) onDataChange()
      alert('Idea updated successfully!')
    }
  }

  const handleFileUpload = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '*/*'
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (event) => {
          setFormData({
            ...formData, 
            attached_file: file.name, 
            attached_file_url: event.target.result
          })
          alert(`File "${file.name}" attached successfully!`)
        }
        reader.readAsDataURL(file)
      }
    }
    fileInput.click()
  }

  const filteredIdeas = ideas.filter(idea => 
    Object.values(idea).some(value => 
      String(value).toLowerCase().includes(localSearchQuery.toLowerCase())
    )
  )

  const paginatedIdeas = filteredIdeas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage)

  return (
    <div className={`tab-content ${isActive ? 'active' : ''} space-y-4`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">idea</h3>
            <p className="text-xs text-slate-400 mt-0.5">Search Bar Options: 1, Date | 2, idea number | 3, idea title | 4, idea source | 5, priority | 6, status</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search ideas..."
              value={localSearchQuery}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <button 
              onClick={() => {
                setEditingId(null)
                setFormData({
                  ...formData,
                  attached_file: null,
                  attached_file_url: ''
                })
                setIsModalOpen(true)
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-xs font-semibold hover:bg-yellow-600 transition"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add New
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dynamic-target-table">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase border-b border-slate-100 tracking-wider">
                <th className="p-4">date</th>
                <th className="p-4">idea number</th>
                <th className="p-4">idea title</th>
                <th className="p-4">priority</th>
                <th className="p-4">dead line</th>
                <th className="p-4">status</th>
                <th className="p-4">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {paginatedIdeas.map((idea) => (
                <tr key={idea.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-semibold">{idea.idea_date}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg font-bold font-mono">
                      {idea.idea_code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-700">{idea.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      idea.priority === 'urgent' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idea.priority}
                    </span>
                  </td>
                  <td className="p-4">{idea.target_date}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      idea.status === 'Approved' ? 'bg-primary-50 text-primary-600' :
                      idea.status === 'Rejected' ? 'bg-primary-50 text-primary-600' :
                      idea.status === 'Under Review' ? 'bg-primary-50 text-primary-600' :
                      'bg-primary-50 text-primary-600'
                    }`}>
                      {idea.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(idea)}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {isCreativeAdmin && (
                        <>
                          <button
                            onClick={() => handleViewDetails(idea)}
                            className="px-2 py-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(idea.id, 'Approved')}
                            disabled={idea.status === 'Approved' || idea.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              idea.status === 'Approved' || idea.status === 'Rejected'
                                ? 'bg-primary-50 text-primary-300 cursor-not-allowed'
                                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                            }`}
                            title="Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(idea.id, 'Rejected')}
                            disabled={idea.status === 'Approved' || idea.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              idea.status === 'Approved' || idea.status === 'Rejected'
                                ? 'bg-primary-50 text-primary-300 cursor-not-allowed'
                                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                            }`}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="px-2 py-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="text-xs text-slate-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredIdeas.length)} of {filteredIdeas.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded text-xs hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-xs text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded text-xs hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setEditingId(null)
              if (formData.attached_file_url) {
                URL.revokeObjectURL(formData.attached_file_url)
              }
              setIsModalOpen(false)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-lightbulb text-yellow-500 mr-2"></i>Idea Form
              </h3>
              <button 
                onClick={() => {
                  setEditingId(null)
                  if (formData.attached_file_url) {
                    URL.revokeObjectURL(formData.attached_file_url)
                  }
                  setIsModalOpen(false)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="p-5 space-y-4 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">idea number</label>
                  <input
                    type="text"
                    required
                    placeholder="IDEA-230"
                    value={formData.idea_number}
                    onChange={(e) => setFormData({...formData, idea_number: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">idea title</label>
                <input
                  type="text"
                  required
                  placeholder="idea title"
                  value={formData.idea_title}
                  onChange={(e) => setFormData({...formData, idea_title: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">idea source</label>
                <select
                  required
                  value={formData.idea_source}
                  onChange={(e) => setFormData({...formData, idea_source: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="staff">staff</option>
                  <option value="management">management</option>
                  <option value="customer">customer</option>
                  <option value="self generated">self generated</option>
                  <option value="other">other..</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">priority</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="urgent">urgent</option>
                    <option value="normal">normal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">dead line date/time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dead_line_date_time}
                    onChange={(e) => setFormData({...formData, dead_line_date_time: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">discription</label>
                <textarea
                  required
                  rows="3"
                  value={formData.discription}
                  onChange={(e) => setFormData({...formData, discription: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">cost estimation</label>
                <input
                  type="text"
                  required
                  value={formData.cost_estimation}
                  onChange={(e) => setFormData({...formData, cost_estimation: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="text input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">upload file</label>
                <button
                  type="button"
                  onClick={handleFileUpload}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                >
                  <i className="fa-solid fa-upload mr-2"></i>Choose File
                </button>
                {formData.attached_file && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-semibold text-green-800">Attached File:</p>
                      <button 
                        onClick={() => {
                          if (formData.attached_file_url) {
                            URL.revokeObjectURL(formData.attached_file_url)
                          }
                          setFormData({...formData, attached_file: null, attached_file_url: ''})
                          alert('File removed')
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800"
                        title="Remove file"
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    </div>
                    <p className="text-xs text-green-600">{formData.attached_file}</p>
                    {formData.attached_file_url && formData.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <img 
                        src={formData.attached_file_url} 
                        alt="Preview" 
                        className="mt-2 max-h-32 object-contain rounded"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 text-white rounded-xl text-xs font-semibold hover:bg-yellow-600 transition"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal for Admin */}
      {isDetailModalOpen && selectedIdea && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedIdea(null)
              setIsFileViewerOpen(false)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-eye text-primary-500 mr-2"></i>Idea Details
              </h3>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedIdea(null)
                  setIsFileViewerOpen(false)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Idea Code</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedIdea.idea_code}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Idea Date</p>
                  <p className="text-sm text-slate-600">{selectedIdea.idea_date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Source</p>
                  <p className="text-sm text-slate-600">{selectedIdea.source}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Priority</p>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    selectedIdea.priority === 'urgent' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedIdea.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Target Date</p>
                  <p className="text-sm text-slate-600">{selectedIdea.target_date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Estimated Cost</p>
                  <p className="text-sm text-slate-600">{selectedIdea.estimated_cost}</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Title</p>
                <p className="text-sm font-semibold text-slate-800">{selectedIdea.title}</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIdea.description}</p>
              </div>

              {/* Attached File */}
              {selectedIdea.attached_file && (
                <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-800 mb-2">
                    <i className="fa-solid fa-paperclip mr-1"></i>Attached File
                  </p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsFileViewerOpen(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                    >
                      <i className="fa-solid fa-eye mr-1"></i>View File
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedIdea.attached_file_url) {
                          const link = document.createElement('a')
                          link.href = selectedIdea.attached_file_url
                          link.download = selectedIdea.attached_file
                          link.click()
                        } else {
                          alert('File data not available for download')
                        }
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                    >
                      <i className="fa-solid fa-download mr-1"></i>Download
                    </button>
                    <span className="text-xs text-green-600">{selectedIdea.attached_file}</span>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isCreativeAdmin && (
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                  <button
                    onClick={handleRejectWithDetails}
                    disabled={selectedIdea.status === 'Approved' || selectedIdea.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedIdea.status === 'Approved' || selectedIdea.status === 'Rejected'
                        ? 'bg-primary-200 text-primary-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <i className="fa-solid fa-times mr-2"></i>Reject
                  </button>
                  <button
                    onClick={handleApproveWithDetails}
                    disabled={selectedIdea.status === 'Approved' || selectedIdea.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedIdea.status === 'Approved' || selectedIdea.status === 'Rejected'
                        ? 'bg-primary-200 text-primary-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <i className="fa-solid fa-check mr-2"></i>Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {isFileViewerOpen && selectedIdea?.attached_file && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsFileViewerOpen(false)}
          ></div>
          <div className="bg-white w-11/12 max-w-4xl mx-auto rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-file-arrow-up text-green-500 mr-2"></i>File Viewer
              </h3>
              <button 
                onClick={() => {
                  setIsFileViewerOpen(false)
                  setSelectedIdea(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              {selectedIdea.attached_file_url && selectedIdea.attached_file_url.startsWith('data:') ? (
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  {selectedIdea.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={selectedIdea.attached_file_url} 
                      alt={selectedIdea.attached_file}
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                      <p className="text-sm font-semibold text-slate-700 mb-2">{selectedIdea.attached_file}</p>
                      <p className="text-xs text-slate-500 mb-4">File preview available for images only</p>
                    </>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = selectedIdea.attached_file_url
                        link.download = selectedIdea.attached_file
                        link.click()
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                    >
                      <i className="fa-solid fa-download mr-2"></i>Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{selectedIdea.attached_file}</p>
                  <p className="text-xs text-slate-500 mb-4">File data not available for preview</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => alert('File data not available. Please re-attach the file.')}
                      className="px-4 py-2 bg-slate-400 text-white rounded-lg text-xs font-semibold cursor-not-allowed"
                      disabled
                    >
                      <i className="fa-solid fa-download mr-2"></i>Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IdeaTab