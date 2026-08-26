import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'
import { notifyAdminNewLeave, notifyLeaveStatus } from '../lib/creativeNotificationService'

const LeaveTab = ({ isActive, searchQuery, onDataChange }) => {
  const { isCreativeAdmin, user } = useCreativeAuth()
  const [leaves, setLeaves] = useState([
    {
      id: 1,
      application_date: '2026-06-10',
      leave_from: '2026-06-12',
      leave_to: '2026-06-20',
      leave_type: 'year leave',
      justification: 'Family personal matters administration',
      status: 'Under Review'
    }
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [formData, setFormData] = useState({
    application_date: '',
    leave_from: '',
    leave_to: '',
    leave_type: 'year leave',
    justification: '',
    text_message: '',
    voice_note: '',
    voice_note_url: '',
    attached_file: null,
    attached_file_url: ''
  })
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])

  useEffect(() => {
    if (isActive) {
      fetchLeaves()
    }
  }, [isActive])

  const fetchLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('crt_staff_leaves')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching leaves:', error)
        // Show sample data if table doesn't exist
        setLeaves([
          {
            id: 1,
            application_date: '2026-06-10',
            leave_from: '2026-06-12',
            leave_to: '2026-06-20',
            leave_type: 'year leave',
            justification: 'Family personal matters administration',
            status: 'Under Review'
          }
        ])
      } else {
        setLeaves(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      // Show sample data on any error
      setLeaves([
        {
          id: 1,
          application_date: '2026-06-10',
          leave_from: '2026-06-12',
          leave_to: '2026-06-20',
          leave_type: 'year leave',
          justification: 'Family personal matters administration',
          status: 'Under Review'
        }
      ])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if audio data is too large for database
    if (formData.voice_note_url && formData.voice_note_url.length > 10000000) {
      alert('Audio file is too large. Please record a shorter voice note (max 10MB).')
      return
    }
    
    // Check if file data is too large for database
    if (formData.attached_file_url && formData.attached_file_url.length > 10000000) {
      alert('Attached file is too large. Please attach a smaller file (max 10MB).')
      return
    }
    
    const { data, error } = await supabase
      .from('crt_staff_leaves')
      .insert([{
        application_date: formData.application_date,
        leave_id: `LEAVE-${Date.now()}`,
        employee_name: 'Current User',
        leave_from: formData.leave_from,
        leave_to: formData.leave_to,
        leave_type: formData.leave_type,
        justification: formData.justification,
        status: 'Pending',
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      }])
    
    if (error) {
      console.error('Error adding leave:', error)
      alert(`Error adding leave request: ${error.message}`)
    } else {
      setIsModalOpen(false)
      setFormData({
        application_date: '',
        leave_from: '',
        leave_to: '',
        leave_type: 'year leave',
        justification: '',
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: ''
      })
      fetchLeaves()
      if (onDataChange) onDataChange()
      
      // Notify admins about new leave request
      try {
        await notifyAdminNewLeave(data[0].id, formData.leave_type, user?.email || 'Unknown User')
        console.log('Leave notification sent successfully')
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }
      
      alert('Leave request submitted successfully!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return
    
    const { error } = await supabase
      .from('crt_staff_leaves')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting leave:', error)
      alert('Error deleting leave request')
    } else {
      fetchLeaves()
      if (onDataChange) onDataChange()
      alert('Leave request deleted successfully!')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    const { data, error } = await supabase
      .from('crt_staff_leaves')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } else {
      fetchLeaves()
      if (onDataChange) onDataChange()
      
      // Notify user about status change
      try {
        const leave = data
        if (leave) {
          // Use the current user's ID for notification
          await notifyLeaveStatus(user.id, id, newStatus, leave.leave_type)
          console.log('Leave status notification sent successfully')
        }
      } catch (notificationError) {
        console.error('Error sending status notification:', notificationError)
      }
      
      alert(`Status updated to ${newStatus}`)
    }
  }

  const handleVoiceAction = async () => {
    if (isRecording) {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
      setIsRecording(false)
      setRecordingTime(0)
      if (recordingInterval) {
        clearInterval(recordingInterval)
        setRecordingInterval(null)
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        const chunks = []
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' })
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Audio = reader.result
            const duration = recordingTime
            setFormData({
              ...formData,
              voice_note: `Voice recording (${duration}s) - ${new Date().toLocaleString()}`,
              voice_note_url: base64Audio
            })
            alert('Voice recording saved successfully!')
          }
          reader.readAsDataURL(audioBlob)
          stream.getTracks().forEach(track => track.stop())
        }
        
        setMediaRecorder(recorder)
        setAudioChunks(chunks)
        recorder.start()
        setIsRecording(true)
        setRecordingTime(0)
        const interval = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        setRecordingInterval(interval)
        alert('Voice recording started...')
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Could not access microphone. Please allow microphone access.')
      }
    }
  }

  const handleTextAction = () => {
    const text = prompt('Enter your message:')
    if (text) {
      setFormData({...formData, text_message: text})
      alert('Text message added successfully!')
    }
  }

  const handleFileAction = () => {
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

  const handleViewDetails = async (leave) => {
    setSelectedLeave(leave)
    setIsDetailModalOpen(true)
  }

  const handleApproveWithDetails = async () => {
    await handleStatusUpdate(selectedLeave.id, 'Approved')
    setIsDetailModalOpen(false)
    setSelectedLeave(null)
  }

  const handleRejectWithDetails = async () => {
    await handleStatusUpdate(selectedLeave.id, 'Rejected')
    setIsDetailModalOpen(false)
    setSelectedLeave(null)
  }

  const handleEdit = (leave) => {
    setFormData({
      application_date: leave.application_date,
      leave_from: leave.leave_from,
      leave_to: leave.leave_to,
      leave_type: leave.leave_type,
      justification: leave.justification,
      text_message: leave.text_message || '',
      voice_note: leave.voice_note || '',
      voice_note_url: leave.voice_note_url || '',
      attached_file: leave.attached_file || null,
      attached_file_url: leave.attached_file_url || ''
    })
    setEditingId(leave.id)
    setIsModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('crt_staff_leaves')
      .update({
        application_date: formData.application_date,
        leave_from: formData.leave_from,
        leave_to: formData.leave_to,
        leave_type: formData.leave_type,
        justification: formData.justification,
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      })
      .eq('id', editingId)
    
    if (error) {
      console.error('Error updating leave:', error)
      alert('Error updating leave request')
    } else {
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({
        application_date: '',
        leave_from: '',
        leave_to: '',
        leave_type: 'year leave',
        justification: '',
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: ''
      })
      fetchLeaves()
      if (onDataChange) onDataChange()
      alert('Leave request updated successfully!')
    }
  }

  const filteredLeaves = leaves.filter(leave => 
    Object.values(leave).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className={`tab-content ${isActive ? 'active' : ''} space-y-4`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">leave Request</h3>
            <p className="text-xs text-slate-400 mt-0.5">Request</p>
            <p className="text-xs text-slate-400 mt-0.5">Search Bar Options: 1, Date | 2, status</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.open('#/leave', '_blank')}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
              title="Open HR Leave Portal"
            >
              <i className="fa-solid fa-external-link mr-1"></i> HR Portal
            </button>
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
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add New
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dynamic-target-table">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase border-b border-slate-100 tracking-wider">
                <th className="p-4">no</th>
                <th className="p-4">Date</th>
                <th className="p-4">request date</th>
                <th className="p-4">reason type</th>
                <th className="p-4">request status</th>
                <th className="p-4">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {filteredLeaves.map((leave, index) => (
                <tr key={leave.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-semibold">{index + 1}</td>
                  <td className="p-4">{leave.application_date}</td>
                  <td className="p-4">{leave.leave_from} — {leave.leave_to}</td>
                  <td className="p-4">{leave.leave_type}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      leave.status === 'Approved' ? 'bg-primary-50 text-error-600' :
                      leave.status === 'Rejected' ? 'bg-red-50 text-error-600' :
                      leave.status === 'Under Review' ? 'bg-primary-50 text-error-600' :
                      'bg-primary-50 text-error-600'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(leave)}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {isCreativeAdmin && (
                        <>
                          <button
                            onClick={() => handleViewDetails(leave)}
                            className="px-2 py-1 bg-primary-100 text-error-600 rounded hover:bg-primary-200 transition"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                            disabled={leave.status === 'Approved' || leave.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              leave.status === 'Approved' || leave.status === 'Rejected'
                                ? 'bg-primary-50 text-error-300 cursor-not-allowed'
                                : 'bg-primary-100 text-error-600 hover:bg-primary-200'
                            }`}
                            title="Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                            disabled={leave.status === 'Approved' || leave.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              leave.status === 'Approved' || leave.status === 'Rejected'
                                ? 'bg-red-50 text-error-300 cursor-not-allowed'
                                : 'bg-red-100 text-error-600 hover:bg-red-200'
                            }`}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(leave.id)}
                        className="px-2 py-1 bg-red-100 text-error-600 rounded hover:bg-red-200 transition"
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
      </div>

      {isModalOpen && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setEditingId(null)
              if (formData.voice_note_url) {
                URL.revokeObjectURL(formData.voice_note_url)
              }
              if (formData.attached_file_url) {
                URL.revokeObjectURL(formData.attached_file_url)
              }
              setIsModalOpen(false)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-lg mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-calendar-minus text-purple-500 mr-2"></i>Leave Request Form
              </h3>
              <button 
                onClick={() => {
                  setEditingId(null)
                  if (formData.voice_note_url) {
                    URL.revokeObjectURL(formData.voice_note_url)
                  }
                  if (formData.attached_file_url) {
                    URL.revokeObjectURL(formData.attached_file_url)
                  }
                  setIsModalOpen(false)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="p-5 space-y-4 shadow-inner">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">date</label>
                <input
                  type="date"
                  required
                  value={formData.application_date}
                  onChange={(e) => setFormData({...formData, application_date: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">requiest date</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={formData.leave_from}
                      onChange={(e) => setFormData({...formData, leave_from: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">—</span>
                    <input
                      type="date"
                      required
                      value={formData.leave_to}
                      onChange={(e) => setFormData({...formData, leave_to: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">request reason</label>
                <textarea
                  required
                  rows="3"
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="justification"
                />
              </div>

              {/* Leave Type Options */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Leave Type Options</p>
                <div className="space-y-2">
                  {['year leave', 'Sick Leave', 'marrage', 'Maternity / Paternity Leave', 'Bereavement Leave', 'Casual / Personal Leave'].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="leave_type"
                        value={type}
                        checked={formData.leave_type === type}
                        onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                        className="rounded text-purple-600"
                      />
                      <span className="text-xs text-slate-600">{type}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="text"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Inputs */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Action Inputs</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={handleTextAction}
                    className="px-4 py-2 bg-primary-100 text-error-700 rounded-xl text-xs font-semibold hover:bg-primary-200 transition"
                  >
                    <i className="fa-solid fa-font mr-2"></i>text
                  </button>
                  <button
                    type="button"
                    onClick={handleVoiceAction}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                      isRecording ? 'bg-red-100 text-error-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>
                    {isRecording ? `voice (${recordingTime}s)` : 'voice'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFileAction}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-200 transition"
                  >
                    <i className="fa-solid fa-file-arrow-up mr-2"></i>file
                  </button>
                </div>
              </div>

              {/* Show Action Inputs */}
              {formData.text_message && (
                <div className="p-3 bg-primary-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-semibold text-error-800">Text Message:</p>
                    <button 
                      onClick={() => setFormData({...formData, text_message: ''})}
                      className="text-xs text-error-600 hover:text-error-800"
                      title="Remove text"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  <p className="text-xs text-error-600 whitespace-pre-wrap">{formData.text_message}</p>
                </div>
              )}

              {formData.voice_note && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-semibold text-purple-800">Voice Note:</p>
                    <button 
                      onClick={() => {
                        if (formData.voice_note_url) {
                          URL.revokeObjectURL(formData.voice_note_url)
                        }
                        setFormData({...formData, voice_note: '', voice_note_url: ''})
                        alert('Voice note removed')
                      }}
                      className="text-xs text-error-600 hover:text-error-800"
                      title="Remove voice note"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  <p className="text-xs text-purple-600">{formData.voice_note}</p>
                  {formData.voice_note_url && (
                    <audio src={formData.voice_note_url} controls className="w-full mt-2 h-8" />
                  )}
                </div>
              )}

              {formData.attached_file && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
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
                      className="text-xs text-error-600 hover:text-error-800"
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

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
                >
                  [ add ]
                </button>
              </div>
              <p className="text-xs text-slate-400 italic text-center">
                *(Note at bottom: "when add clicked")
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal for Admin */}
      {isDetailModalOpen && selectedLeave && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedLeave(null)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-eye text-error-500 mr-2"></i>Leave Request Details
              </h3>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedLeave(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Leave ID</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedLeave.leave_id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Application Date</p>
                  <p className="text-sm text-slate-600">{selectedLeave.application_date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Employee Name</p>
                  <p className="text-sm text-slate-600">{selectedLeave.employee_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Leave Type</p>
                  <p className="text-sm text-slate-600">{selectedLeave.leave_type}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Leave From</p>
                  <p className="text-sm text-slate-600">{selectedLeave.leave_from}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Leave To</p>
                  <p className="text-sm text-slate-600">{selectedLeave.leave_to}</p>
                </div>
              </div>

              {/* Justification */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Justification</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedLeave.justification}</p>
              </div>

              {/* Action Inputs Section */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Action Inputs</p>
                
                {/* Text Message */}
                {selectedLeave.text_message && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-semibold text-error-800">
                        <i className="fa-solid fa-font mr-1"></i>Text Message
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLeave.text_message)
                          alert('Text copied to clipboard!')
                        }}
                        className="text-xs text-error-600 hover:text-error-800"
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </div>
                    <p className="text-sm text-error-600 whitespace-pre-wrap">{selectedLeave.text_message}</p>
                  </div>
                )}

                {/* Voice Note */}
                {selectedLeave.voice_note && (
                  <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-2">
                      <i className="fa-solid fa-microphone mr-1"></i>Voice Note
                    </p>
                    <div className="flex items-center gap-3">
                      {selectedLeave.voice_note_url ? (
                        <>
                          <audio 
                            ref={(audio) => {
                              if (audio) {
                                audio.onplay = () => setIsPlayingVoice(true)
                                audio.onpause = () => setIsPlayingVoice(false)
                                audio.onended = () => setIsPlayingVoice(false)
                              }
                            }}
                            src={selectedLeave.voice_note_url}
                            controls
                            className="flex-1 h-8"
                          />
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            alert('Voice recording not available. This may be an old recording without audio data.')
                          }}
                          className="px-4 py-2 bg-purple-300 text-white rounded-lg text-xs font-semibold cursor-not-allowed"
                          disabled
                        >
                          <i className="fa-solid fa-play mr-1"></i>No Audio
                        </button>
                      )}
                      <span className="text-xs text-purple-600">{selectedLeave.voice_note}</span>
                    </div>
                  </div>
                )}

                {/* Attached File */}
                {selectedLeave.attached_file && (
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
                          if (selectedLeave.attached_file_url) {
                            const link = document.createElement('a')
                            link.href = selectedLeave.attached_file_url
                            link.download = selectedLeave.attached_file
                            link.click()
                          } else {
                            alert('File data not available for download')
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                      >
                        <i className="fa-solid fa-download mr-1"></i>Download
                      </button>
                      <span className="text-xs text-green-600">{selectedLeave.attached_file}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isCreativeAdmin && (
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                  <button
                    onClick={handleRejectWithDetails}
                    disabled={selectedLeave.status === 'Approved' || selectedLeave.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedLeave.status === 'Approved' || selectedLeave.status === 'Rejected'
                        ? 'bg-red-200 text-error-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <i className="fa-solid fa-times mr-2"></i>Reject
                  </button>
                  <button
                    onClick={handleApproveWithDetails}
                    disabled={selectedLeave.status === 'Approved' || selectedLeave.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedLeave.status === 'Approved' || selectedLeave.status === 'Rejected'
                        ? 'bg-primary-200 text-error-400 cursor-not-allowed'
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
      {isFileViewerOpen && selectedLeave?.attached_file && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsFileViewerOpen(false)
              setSelectedLeave(null)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-4xl mx-auto rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-file-arrow-up text-green-500 mr-2"></i>File Viewer
              </h3>
              <button 
                onClick={() => {
                  setIsFileViewerOpen(false)
                  setSelectedLeave(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              {selectedLeave.attached_file_url && selectedLeave.attached_file_url.startsWith('data:') ? (
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  {selectedLeave.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={selectedLeave.attached_file_url} 
                      alt={selectedLeave.attached_file}
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                      <p className="text-sm font-semibold text-slate-700 mb-2">{selectedLeave.attached_file}</p>
                      <p className="text-xs text-slate-500 mb-4">File preview available for images only</p>
                    </>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = selectedLeave.attached_file_url
                        link.download = selectedLeave.attached_file
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
                  <p className="text-sm font-semibold text-slate-700 mb-2">{selectedLeave.attached_file}</p>
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

export default LeaveTab