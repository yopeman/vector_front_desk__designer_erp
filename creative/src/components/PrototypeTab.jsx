import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'
import { notifyAdminNewPrototype, notifyPrototypeStatus } from '../lib/creativeNotificationService'

const PrototypeTab = ({ isActive, searchQuery, onDataChange }) => {
  const { isCreativeAdmin, user } = useCreativeAuth()
  const [prototypes, setPrototypes] = useState([
    {
      id: 1,
      request_date: '2026-06-15',
      request_number: 'REQ-0941',
      requested_by: 'Marketing Dept',
      description: 'Acrylic custom sign mockup fabrication',
      priority: 'High',
      deadline: '2026-06-25',
      status: 'On Progress'
    }
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedPrototype, setSelectedPrototype] = useState(null)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    requiest_number: '',
    requesting_departement: '',
    discription: '',
    priority: 'midium',
    assigned_to: '',
    dead_line: '',
    share_to: '',
    text_message: '',
    voice_note: '',
    voice_note_url: '',
    attached_file: null,
    attached_file_url: ''
  })
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (isActive) {
      fetchPrototypes()
    }
  }, [isActive])

  // Cleanup recording interval and audio URL on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
      if (formData.voice_note_url) {
        URL.revokeObjectURL(formData.voice_note_url)
      }
    }
  }, [recordingInterval, formData.voice_note_url])

  const fetchPrototypes = async () => {
    try {
      const { data, error } = await supabase
        .from('crt_prototype_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching prototypes:', error)
        // Show sample data if table doesn't exist
        setPrototypes([
          {
            id: 1,
            request_date: '2026-06-15',
            request_number: 'REQ-0941',
            requested_by: 'Marketing Dept',
            description: 'Acrylic custom sign mockup fabrication',
            priority: 'High',
            deadline: '2026-06-25',
            status: 'On Progress'
          }
        ])
      } else {
        setPrototypes(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      // Show sample data on any error
      setPrototypes([
        {
          id: 1,
          request_date: '2026-06-15',
          request_number: 'REQ-0941',
          requested_by: 'Marketing Dept',
          description: 'Acrylic custom sign mockup fabrication',
          priority: 'High',
          deadline: '2026-06-25',
          status: 'On Progress'
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
      .from('crt_prototype_requests')
      .insert([{
        request_date: formData.date,
        request_number: formData.requiest_number,
        department: formData.requesting_departement,
        description: formData.discription,
        priority: formData.priority,
        deadline: formData.dead_line,
        assigned_technologist: formData.assigned_to,
        status: 'Pending',
        start_time: startTime,
        end_time: endTime,
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      }])
    
    if (error) {
      console.error('Error adding prototype:', error)
      alert(`Error adding prototype request: ${error.message}`)
    } else {
      setIsModalOpen(false)
      setFormData({
        date: '',
        requiest_number: '',
        requesting_departement: '',
        discription: '',
        priority: 'midium',
        assigned_to: '',
        dead_line: '',
        share_to: '',
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: ''
      })
      setStartTime('')
      setEndTime('')
      fetchPrototypes()
      if (onDataChange) onDataChange()
      
      // Notify admins about new prototype
      try {
        await notifyAdminNewPrototype(data[0].id, formData.discription, user?.email || 'Unknown User')
        console.log('Prototype notification sent successfully')
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }
      
      alert('Prototype request submitted successfully!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this prototype request?')) return
    
    const { error } = await supabase
      .from('crt_prototype_requests')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting prototype:', error)
      alert('Error deleting prototype request')
    } else {
      fetchPrototypes()
      if (onDataChange) onDataChange()
      alert('Prototype request deleted successfully!')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    const { data, error } = await supabase
      .from('crt_prototype_requests')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } else {
      fetchPrototypes()
      if (onDataChange) onDataChange()
      
      // Notify user about status change
      try {
        // Get the user who submitted the prototype
        const prototype = data
        if (prototype) {
          // Use the current user's ID for notification (since they're the one who submitted it)
          await notifyPrototypeStatus(user.id, id, newStatus, prototype.description)
          console.log('Prototype status notification sent successfully')
        }
      } catch (notificationError) {
        console.error('Error sending status notification:', notificationError)
      }
      
      alert(`Status updated to ${newStatus}`)
    }
  }

  const handleViewDetails = async (prototype) => {
    setSelectedPrototype(prototype)
    setIsDetailModalOpen(true)
  }

  const handleApproveWithDetails = async () => {
    await handleStatusUpdate(selectedPrototype.id, 'Approved')
    setIsDetailModalOpen(false)
    setSelectedPrototype(null)
  }

  const handleRejectWithDetails = async () => {
    await handleStatusUpdate(selectedPrototype.id, 'Rejected')
    setIsDetailModalOpen(false)
    setSelectedPrototype(null)
  }

  const handleEdit = (prototype) => {
    setFormData({
      date: prototype.request_date,
      requiest_number: prototype.request_number,
      requesting_departement: prototype.department,
      discription: prototype.description,
      priority: prototype.priority,
      assigned_to: prototype.assigned_technologist,
      dead_line: prototype.deadline,
      share_to: '',
      text_message: prototype.text_message || '',
      voice_note: prototype.voice_note || '',
      voice_note_url: prototype.voice_note_url || '',
      attached_file: prototype.attached_file || null,
      attached_file_url: prototype.attached_file_url || ''
    })
    setEditingId(prototype.id)
    setIsModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('crt_prototype_requests')
      .update({
        request_date: formData.date,
        request_number: formData.requiest_number,
        department: formData.requesting_departement,
        description: formData.discription,
        priority: formData.priority,
        deadline: formData.dead_line,
        assigned_technologist: formData.assigned_to,
        start_time: startTime,
        end_time: endTime,
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      })
      .eq('id', editingId)
    
    if (error) {
      console.error('Error updating prototype:', error)
      alert('Error updating prototype request')
    } else {
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({
        date: '',
        requiest_number: '',
        requesting_departement: '',
        discription: '',
        priority: 'midium',
        assigned_to: '',
        dead_line: '',
        share_to: '',
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: ''
      })
      setStartTime('')
      setEndTime('')
      fetchPrototypes()
      if (onDataChange) onDataChange()
      alert('Prototype request updated successfully!')
    }
  }

  const handleTextAction = () => {
    const text = prompt('Enter your message:')
    if (text) {
      setFormData({...formData, text_message: text})
      alert('Text message added successfully!')
    }
  }

  const handleVoiceAction = async () => {
    if (isRecording) {
      // Stop recording
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
      // Start actual voice recording
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

  const handleFileAction = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '*/*'
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0]
        // In production, you would upload this to Supabase storage
        // For now, we'll store the file information
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

  const filteredPrototypes = prototypes.filter(p => 
    Object.values(p).some(value => 
      String(value).toLowerCase().includes(localSearchQuery.toLowerCase())
    )
  )

  const paginatedPrototypes = filteredPrototypes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredPrototypes.length / itemsPerPage)

  return (
    <div className={`tab-content ${isActive ? 'active' : ''} space-y-4`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">prototype requiest</h3>
            <p className="text-xs text-slate-400 mt-0.5">Search Bar Options: 1, Date | 2, requiest number | 3, requested by | 4, priority | 5, status</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search prototypes..."
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
                setIsModalOpen(true)
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
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
                <th className="p-4">requiest number</th>
                <th className="p-4">requested by</th>
                <th className="p-4">priority</th>
                <th className="p-4">dead line</th>
                <th className="p-4">status</th>
                <th className="p-4">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {paginatedPrototypes.map((prototype) => (
                <tr key={prototype.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-semibold">{prototype.request_date}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-primary-50 text-success-600 rounded-lg font-bold font-mono">
                      {prototype.request_number}
                    </span>
                  </td>
                  <td className="p-4">{prototype.requested_by}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      prototype.priority === 'high' ? 'bg-primary-50 text-success-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {prototype.priority}
                    </span>
                  </td>
                  <td className="p-4">{prototype.deadline}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      prototype.status === 'Approved' ? 'bg-primary-50 text-success-600' :
                      prototype.status === 'Rejected' ? 'bg-red-50 text-success-600' :
                      prototype.status === 'On Progress' ? 'bg-primary-50 text-success-600' :
                      'bg-primary-50 text-success-600'
                    }`}>
                      {prototype.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(prototype)}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {isCreativeAdmin && (
                        <>
                          <button
                            onClick={() => handleViewDetails(prototype)}
                            className="px-2 py-1 bg-primary-100 text-success-600 rounded hover:bg-primary-200 transition"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(prototype.id, 'Approved')}
                            disabled={prototype.status === 'Approved' || prototype.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              prototype.status === 'Approved' || prototype.status === 'Rejected'
                                ? 'bg-primary-50 text-success-300 cursor-not-allowed'
                                : 'bg-primary-100 text-success-600 hover:bg-primary-200'
                            }`}
                            title="Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(prototype.id, 'Rejected')}
                            disabled={prototype.status === 'Approved' || prototype.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              prototype.status === 'Approved' || prototype.status === 'Rejected'
                                ? 'bg-red-50 text-success-300 cursor-not-allowed'
                                : 'bg-red-100 text-success-600 hover:bg-red-200'
                            }`}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(prototype.id)}
                        className="px-2 py-1 bg-red-100 text-success-600 rounded hover:bg-red-200 transition"
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPrototypes.length)} of {filteredPrototypes.length} entries
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
              setIsModalOpen(false)
              setEditingId(null)
              // Cleanup recording if modal is closed
              if (isRecording) {
                setIsRecording(false)
                setRecordingTime(0)
                if (recordingInterval) {
                  clearInterval(recordingInterval)
                  setRecordingInterval(null)
                }
              }
              // Cleanup audio URL
              if (formData.voice_note_url) {
                URL.revokeObjectURL(formData.voice_note_url)
              }
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-flask text-success-500 mr-2"></i>Prototype Request Form
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingId(null)
                  // Cleanup recording if modal is closed
                  if (isRecording) {
                    setIsRecording(false)
                    setRecordingTime(0)
                    if (recordingInterval) {
                      clearInterval(recordingInterval)
                      setRecordingInterval(null)
                    }
                  }
                  // Cleanup audio URL
                  if (formData.voice_note_url) {
                    URL.revokeObjectURL(formData.voice_note_url)
                  }
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">requiest number</label>
                  <input
                    type="text"
                    required
                    placeholder="REQ-0950"
                    value={formData.requiest_number}
                    onChange={(e) => setFormData({...formData, requiest_number: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">requesting departement</label>
                <select
                  required
                  value={formData.requesting_departement}
                  onChange={(e) => setFormData({...formData, requesting_departement: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Select Department</option>
                  <option value="marketing">marketing</option>
                  <option value="management">management</option>
                </select>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">priority</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="high">high</option>
                    <option value="midium">midium</option>
                    <option value="low">low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">assigned to</label>
                  <input
                    type="text"
                    required
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">dead line</label>
                  <input
                    type="date"
                    required
                    value={formData.dead_line}
                    onChange={(e) => setFormData({...formData, dead_line: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">share to</label>
                  <select
                    required
                    value={formData.share_to}
                    onChange={(e) => setFormData({...formData, share_to: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="marketing manager">marketing manager</option>
                    <option value="managment">managment</option>
                  </select>
                </div>
              </div>

              {/* Action Inputs */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Action Inputs</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={handleTextAction}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      <i className="fa-solid fa-keyboard mr-2"></i>text
                    </button>
                    <button 
                      type="button"
                      onClick={handleVoiceAction}
                      className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        isRecording 
                          ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>
                      {isRecording ? `Recording ${recordingTime}s` : 'voice'}
                    </button>
                    <button 
                      type="button"
                      onClick={handleFileAction}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      <i className="fa-solid fa-paperclip mr-2"></i>file
                    </button>
                  </div>
                  
                  {/* Show added items */}
                  {formData.text_message && (
                    <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-xs font-semibold text-success-800 mb-1">Text Message:</p>
                      <p className="text-xs text-success-600">{formData.text_message}</p>
                    </div>
                  )}
                  
                  {formData.voice_note && (
                    <div className="p-3 bg-primary-50 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-semibold text-primary-800">Voice Note:</p>
                        <button 
                          onClick={() => {
                            if (formData.voice_note_url) {
                              URL.revokeObjectURL(formData.voice_note_url)
                            }
                            setFormData({...formData, voice_note: '', voice_note_url: ''})
                            alert('Voice note removed')
                          }}
                          className="text-xs text-success-600 hover:text-success-800"
                          title="Remove voice note"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                      <p className="text-xs text-primary-600">{formData.voice_note}</p>
                      {formData.voice_note_url && (
                        <audio src={formData.voice_note_url} controls className="w-full mt-2 h-8" />
                      )}
                    </div>
                  )}
                  
                  {formData.attached_file && (
                    <div className="p-3 bg-primary-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-semibold text-primary-800">Attached File:</p>
                        <button 
                          onClick={() => {
                            if (formData.attached_file_url) {
                              URL.revokeObjectURL(formData.attached_file_url)
                            }
                            setFormData({...formData, attached_file: null, attached_file_url: ''})
                            alert('File removed')
                          }}
                          className="text-xs text-success-600 hover:text-success-800"
                          title="Remove file"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                      <p className="text-xs text-primary-600">{formData.attached_file}</p>
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
              </div>

              {/* Process Tracking Controls */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Process Tracking Controls</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setStartTime(new Date().toLocaleTimeString())}
                      className="px-3 py-2 bg-primary-100 text-success-700 rounded-lg text-xs font-semibold hover:bg-primary-200 transition"
                    >
                      start order
                    </button>
                    <span className="text-xs text-slate-600">{startTime || 'recored start time'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setEndTime(new Date().toLocaleTimeString())}
                      className="px-3 py-2 bg-red-100 text-success-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition"
                    >
                      End order
                    </button>
                    <span className="text-xs text-slate-600">{endTime || 'recored end time'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
                >
                  [ send ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal for Admin */}
      {isDetailModalOpen && selectedPrototype && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedPrototype(null)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-eye text-success-500 mr-2"></i>Prototype Request Details
              </h3>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedPrototype(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Request Number</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPrototype.request_number}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Request Date</p>
                  <p className="text-sm text-slate-600">{selectedPrototype.request_date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Department</p>
                  <p className="text-sm text-slate-600">{selectedPrototype.department}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Priority</p>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    selectedPrototype.priority === 'high' ? 'bg-primary-50 text-success-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedPrototype.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Assigned To</p>
                  <p className="text-sm text-slate-600">{selectedPrototype.assigned_technologist}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Deadline</p>
                  <p className="text-sm text-slate-600">{selectedPrototype.deadline}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedPrototype.description}</p>
              </div>

              {/* Action Inputs Section */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Action Inputs</p>
                
                {/* Text Message */}
                {selectedPrototype.text_message && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold text-success-800">
                        <i className="fa-solid fa-keyboard mr-1"></i>Text Message
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPrototype.text_message)
                          alert('Text copied to clipboard!')
                        }}
                        className="text-xs text-success-600 hover:text-success-800"
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </div>
                    <p className="text-sm text-success-600 whitespace-pre-wrap">{selectedPrototype.text_message}</p>
                  </div>
                )}

                {/* Voice Note */}
                {selectedPrototype.voice_note && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-primary-800 mb-2">
                      <i className="fa-solid fa-microphone mr-1"></i>Voice Note
                    </p>
                    <div className="flex items-center gap-3">
                      {selectedPrototype.voice_note_url ? (
                        <>
                          <audio 
                            ref={(audio) => {
                              if (audio) {
                                audio.onplay = () => setIsPlayingVoice(true)
                                audio.onpause = () => setIsPlayingVoice(false)
                                audio.onended = () => setIsPlayingVoice(false)
                              }
                            }}
                            src={selectedPrototype.voice_note_url}
                            controls
                            className="flex-1 h-8"
                          />
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            alert('Voice recording not available. This may be an old recording without audio data.')
                          }}
                          className="px-4 py-2 bg-primary-300 text-white rounded-lg text-xs font-semibold cursor-not-allowed"
                          disabled
                        >
                          <i className="fa-solid fa-play mr-1"></i>No Audio
                        </button>
                      )}
                      <span className="text-xs text-primary-600">{selectedPrototype.voice_note}</span>
                    </div>
                  </div>
                )}

                {/* Attached File */}
                {selectedPrototype.attached_file && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-primary-800 mb-2">
                      <i className="fa-solid fa-paperclip mr-1"></i>Attached File
                    </p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsFileViewerOpen(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                      >
                        <i className="fa-solid fa-eye mr-1"></i>View File
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedPrototype.attached_file_url) {
                            const link = document.createElement('a')
                            link.href = selectedPrototype.attached_file_url
                            link.download = selectedPrototype.attached_file
                            link.click()
                          } else {
                            alert('File data not available for download')
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                      >
                        <i className="fa-solid fa-download mr-1"></i>Download
                      </button>
                      <span className="text-xs text-primary-600">{selectedPrototype.attached_file}</span>
                    </div>
                  </div>
                )}

                {/* No Action Inputs */}
                {!selectedPrototype.text_message && !selectedPrototype.voice_note && !selectedPrototype.attached_file && (
                  <p className="text-xs text-slate-400 italic">No action inputs attached</p>
                )}
              </div>

              {/* Process Tracking */}
              {selectedPrototype.start_time || selectedPrototype.end_time && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Process Tracking</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPrototype.start_time && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Start Time</p>
                        <p className="text-sm text-slate-600">{selectedPrototype.start_time}</p>
                      </div>
                    )}
                    {selectedPrototype.end_time && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">End Time</p>
                        <p className="text-sm text-slate-600">{selectedPrototype.end_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isCreativeAdmin && (
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                  <button
                    onClick={handleRejectWithDetails}
                    disabled={selectedPrototype.status === 'Approved' || selectedPrototype.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedPrototype.status === 'Approved' || selectedPrototype.status === 'Rejected'
                        ? 'bg-red-200 text-success-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <i className="fa-solid fa-times mr-2"></i>Reject
                  </button>
                  <button
                    onClick={handleApproveWithDetails}
                    disabled={selectedPrototype.status === 'Approved' || selectedPrototype.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedPrototype.status === 'Approved' || selectedPrototype.status === 'Rejected'
                        ? 'bg-primary-200 text-success-400 cursor-not-allowed'
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
      {isFileViewerOpen && selectedPrototype?.attached_file && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsFileViewerOpen(false)}
          ></div>
          <div className="bg-white w-11/12 max-w-4xl mx-auto rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-file-arrow-up text-primary-500 mr-2"></i>File Viewer
              </h3>
              <button 
                onClick={() => setIsFileViewerOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              {selectedPrototype.attached_file_url && selectedPrototype.attached_file_url.startsWith('data:') ? (
                // Show image preview if it's an image data URL
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  {selectedPrototype.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={selectedPrototype.attached_file_url} 
                      alt={selectedPrototype.attached_file}
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                      <p className="text-sm font-semibold text-slate-700 mb-2">{selectedPrototype.attached_file}</p>
                      <p className="text-xs text-slate-500 mb-4">File preview available for images only</p>
                    </>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = selectedPrototype.attached_file_url
                        link.download = selectedPrototype.attached_file
                        link.click()
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                    >
                      <i className="fa-solid fa-download mr-2"></i>Download
                    </button>
                  </div>
                </div>
              ) : (
                // Show placeholder if no file data
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{selectedPrototype.attached_file}</p>
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

export default PrototypeTab