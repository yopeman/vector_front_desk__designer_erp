import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'
import { notifyAdminNewDesign, notifyDesignStatus } from '../lib/creativeNotificationService'

const DesignTab = ({ isActive, searchQuery, onDataChange }) => {
  const { isCreativeAdmin, user } = useCreativeAuth()
  const [designs, setDesigns] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    project_number: '',
    project_title: '',
    priority: 'high',
    machining_options: [],
    bom_items: [{ no: 1, item: '', unit: '', quantity: '', u_price: '', t_price: '' }],
    text_message: '',
    voice_note: '',
    voice_note_url: '',
    attached_file: null,
    attached_file_url: '',
    model_3d_file: null,
    model_3d_url: '',
    finishing_file: null,
    finishing_url: ''
  })
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const machiningOptions = ['design', 'upload to co2', 'upload to cnc', 'upload to 3D print', 'upload to fiber', 'upload to fiber mark', 'upload to uv printer']

  useEffect(() => {
    if (isActive) {
      fetchDesigns()
    }
  }, [isActive])

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('crt_design_bom')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching designs:', error)
        // Show sample data if table doesn't exist
        setDesigns([
          {
            id: 1,
            design_date: '2026-06-12',
            project_number: 'DSGN-883',
            project_title: 'Vector Acrylic Frame',
            priority: 'High',
            status: 'Ready'
          }
        ])
      } else {
        setDesigns(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      // Show sample data on any error
      setDesigns([
        {
          id: 1,
          design_date: '2026-06-12',
          project_number: 'DSGN-883',
          project_title: 'Vector Acrylic Frame',
          priority: 'High',
          status: 'Ready'
        }
      ])
    }
  }

  const handleMachineRouteChange = (route) => {
    setFormData(prev => ({
      ...prev,
      machining_options: prev.machining_options.includes(route)
        ? prev.machining_options.filter(r => r !== route)
        : [...prev.machining_options, route]
    }))
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
    
    // Convert BOM items to JSON string
    const bomData = JSON.stringify(formData.bom_items)
    
    const { data, error } = await supabase
      .from('crt_design_bom')
      .insert([{
        design_date: formData.date,
        design_reference: formData.project_number,
        project_title: formData.project_title,
        priority: formData.priority,
        machine_routes: formData.machining_options,
        status: 'Pending',
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url,
        model_3d_file: formData.model_3d_file,
        model_3d_url: formData.model_3d_url,
        finishing_file: formData.finishing_file,
        finishing_url: formData.finishing_url,
        bom_item: bomData
      }])
    
    if (error) {
      console.error('Error adding design:', error)
      alert(`Error adding design: ${error.message}`)
    } else {
      setIsModalOpen(false)
      setFormData({
        date: '',
        project_number: '',
        project_title: '',
        priority: 'high',
        machining_options: [],
        bom_items: [{ no: 1, item: '', unit: '', quantity: '', u_price: '', t_price: '' }],
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: '',
        model_3d_file: null,
        model_3d_url: '',
        finishing_file: null,
        finishing_url: ''
      })
      fetchDesigns()
      if (onDataChange) onDataChange()
      
      // Notify admins about new design
      try {
        await notifyAdminNewDesign(data[0].id, formData.project_title, user?.email || 'Unknown User')
        console.log('Design notification sent successfully')
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }
      
      alert('Design submitted successfully!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this design?')) return
    
    const { error } = await supabase
      .from('crt_design_bom')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting design:', error)
      alert('Error deleting design')
    } else {
      fetchDesigns()
      if (onDataChange) onDataChange()
      alert('Design deleted successfully!')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    const { data, error } = await supabase
      .from('crt_design_bom')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } else {
      fetchDesigns()
      if (onDataChange) onDataChange()
      
      // Notify user about status change
      try {
        const design = data
        if (design) {
          // Use the current user's ID for notification
          await notifyDesignStatus(user.id, id, newStatus, design.project_title)
          console.log('Design status notification sent successfully')
        }
      } catch (notificationError) {
        console.error('Error sending status notification:', notificationError)
      }
      
      alert(`Status updated to ${newStatus}`)
    }
  }

  const handleViewDetails = async (design) => {
    setSelectedDesign(design)
    setIsDetailModalOpen(true)
  }

  const handleApproveWithDetails = async () => {
    await handleStatusUpdate(selectedDesign.id, 'Approved')
    setIsDetailModalOpen(false)
    setIsFileViewerOpen(false)
    setSelectedDesign(null)
  }

  const handleRejectWithDetails = async () => {
    await handleStatusUpdate(selectedDesign.id, 'Rejected')
    setIsDetailModalOpen(false)
    setIsFileViewerOpen(false)
    setSelectedDesign(null)
  }

  const handleEdit = (design) => {
    setFormData({
      date: design.design_date,
      project_number: design.design_reference,
      project_title: design.project_title,
      priority: design.priority,
      machining_options: Array.isArray(design.machine_routes) ? design.machine_routes : [],
      bom_items: design.bom_item ? JSON.parse(design.bom_item) : [{ no: 1, item: '', unit: '', quantity: '', u_price: '', t_price: '' }],
      text_message: design.text_message || '',
      voice_note: design.voice_note || '',
      voice_note_url: design.voice_note_url || '',
      attached_file: design.attached_file || null,
      attached_file_url: design.attached_file_url || '',
      model_3d_file: design.model_3d_file || null,
      model_3d_url: design.model_3d_url || '',
      finishing_file: design.finishing_file || null,
      finishing_url: design.finishing_url || ''
    })
    setEditingId(design.id)
    setIsModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    // Convert BOM items to JSON string
    const bomData = JSON.stringify(formData.bom_items)
    
    const { error } = await supabase
      .from('crt_design_bom')
      .update({
        design_date: formData.date,
        design_reference: formData.project_number,
        project_title: formData.project_title,
        priority: formData.priority,
        machine_routes: formData.machining_options,
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url,
        model_3d_file: formData.model_3d_file,
        model_3d_url: formData.model_3d_url,
        finishing_file: formData.finishing_file,
        finishing_url: formData.finishing_url,
        bom_item: bomData
      })
      .eq('id', editingId)
    
    if (error) {
      console.error('Error updating design:', error)
      alert('Error updating design')
    } else {
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({
        date: '',
        project_number: '',
        project_title: '',
        priority: 'high',
        machining_options: [],
        bom_items: [{ no: 1, item: '', unit: '', quantity: '', u_price: '', t_price: '' }],
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: '',
        model_3d_file: null,
        model_3d_url: '',
        finishing_file: null,
        finishing_url: ''
      })
      fetchDesigns()
      if (onDataChange) onDataChange()
      alert('Design updated successfully!')
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

  const handle3DModelUpload = () => {
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
            model_3d_file: file.name, 
            model_3d_url: event.target.result
          })
          alert(`3D Model "${file.name}" uploaded successfully!`)
        }
        reader.readAsDataURL(file)
      }
    }
    fileInput.click()
  }

  const handleFinishingUpload = () => {
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
            finishing_file: file.name, 
            finishing_url: event.target.result
          })
          alert(`Finishing Design "${file.name}" uploaded successfully!`)
        }
        reader.readAsDataURL(file)
      }
    }
    fileInput.click()
  }

  const filteredDesigns = designs.filter(design => 
    Object.values(design).some(value => 
      String(value).toLowerCase().includes(localSearchQuery.toLowerCase())
    )
  )

  const paginatedDesigns = filteredDesigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage)

  return (
    <div className={`tab-content ${isActive ? 'active' : ''} space-y-4`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">design login</h3>
            <p className="text-xs text-slate-400 mt-0.5">Search Bar Options: 1. Date | 2, idea number | 3, idea title | 4, idea source | 5, priority | 6, status</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search designs..."
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
                  attached_file_url: '',
                  model_3d_file: null,
                  model_3d_url: '',
                  finishing_file: null,
                  finishing_url: ''
                })
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
                <th className="p-4">project number</th>
                <th className="p-4">project title</th>
                <th className="p-4">priority</th>
                <th className="p-4">dead line</th>
                <th className="p-4">status</th>
                <th className="p-4">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {paginatedDesigns.map((design) => (
                <tr key={design.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-semibold">{design.design_date}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg font-bold font-mono">
                      {design.design_reference}
                    </span>
                  </td>
                  <td className="p-4">{design.project_title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      design.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {design.priority}
                    </span>
                  </td>
                  <td className="p-4">-</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      design.status === 'Approved' ? 'bg-primary-50 text-error-600' :
                      design.status === 'Rejected' ? 'bg-primary-50 text-error-600' :
                      design.status === 'On Progress' ? 'bg-primary-50 text-error-600' :
                      'bg-primary-50 text-error-600'
                    }`}>
                      {design.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(design)}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {isCreativeAdmin && (
                        <>
                          <button
                            onClick={() => handleViewDetails(design)}
                            className="px-2 py-1 bg-primary-100 text-error-600 rounded hover:bg-primary-200 transition"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(design.id, 'Approved')}
                            disabled={design.status === 'Approved' || design.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              design.status === 'Approved' || design.status === 'Rejected'
                                ? 'bg-primary-50 text-error-300 cursor-not-allowed'
                                : 'bg-primary-100 text-error-600 hover:bg-primary-200'
                            }`}
                            title="Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(design.id, 'Rejected')}
                            disabled={design.status === 'Approved' || design.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              design.status === 'Approved' || design.status === 'Rejected'
                                ? 'bg-primary-50 text-error-300 cursor-not-allowed'
                                : 'bg-primary-100 text-error-600 hover:bg-primary-200'
                            }`}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(design.id)}
                        className="px-2 py-1 bg-primary-100 text-error-600 rounded hover:bg-primary-200 transition"
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDesigns.length)} of {filteredDesigns.length} entries
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
              if (formData.voice_note_url) {
                URL.revokeObjectURL(formData.voice_note_url)
              }
              if (formData.attached_file_url) {
                URL.revokeObjectURL(formData.attached_file_url)
              }
              if (formData.model_3d_url) {
                URL.revokeObjectURL(formData.model_3d_url)
              }
              if (formData.finishing_url) {
                URL.revokeObjectURL(formData.finishing_url)
              }
              setIsModalOpen(false)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-4xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-compass-drafting text-error-500 mr-2"></i>Design & Manufacturing Form
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
                  if (formData.model_3d_url) {
                    URL.revokeObjectURL(formData.model_3d_url)
                  }
                  if (formData.finishing_url) {
                    URL.revokeObjectURL(formData.finishing_url)
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">project number</label>
                  <input
                    type="text"
                    required
                    placeholder="DSGN-900"
                    value={formData.project_number}
                    onChange={(e) => setFormData({...formData, project_number: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">project title</label>
                  <input
                    type="text"
                    required
                    placeholder="project title"
                    value={formData.project_title}
                    onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
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
              </div>

              {/* Machining Options */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Machining Options</p>
                <div className="grid grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  {machiningOptions.map(option => (
                    <label key={option} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={formData.machining_options.includes(option)}
                        onChange={() => handleMachineRouteChange(option)}
                        className="rounded text-error-600"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Design Upload Options */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Design Upload Options</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">3D model</label>
                    <button
                      type="button"
                      onClick={handle3DModelUpload}
                      className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      <i className="fa-solid fa-upload mr-2"></i>upload file
                    </button>
                    {formData.model_3d_file && (
                      <div className="mt-2 p-2 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-error-600">{formData.model_3d_file}</p>
                          <button 
                            onClick={() => {
                              if (formData.model_3d_url) {
                                URL.revokeObjectURL(formData.model_3d_url)
                              }
                              setFormData({...formData, model_3d_file: null, model_3d_url: ''})
                            }}
                            className="text-xs text-error-600 hover:text-error-800"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">finishing / Assumbly design</label>
                    <button
                      type="button"
                      onClick={handleFinishingUpload}
                      className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      <i className="fa-solid fa-upload mr-2"></i>upload file
                    </button>
                    {formData.finishing_file && (
                      <div className="mt-2 p-2 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-error-600">{formData.finishing_file}</p>
                          <button 
                            onClick={() => {
                              if (formData.finishing_url) {
                                URL.revokeObjectURL(formData.finishing_url)
                              }
                              setFormData({...formData, finishing_file: null, finishing_url: ''})
                            }}
                            className="text-xs text-error-600 hover:text-error-800"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                      isRecording ? 'bg-primary-100 text-error-700' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>
                    {isRecording ? `voice (${recordingTime}s)` : 'voice'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFileAction}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-xs font-semibold hover:bg-primary-200 transition"
                  >
                    <i className="fa-solid fa-file-arrow-up mr-2"></i>file
                  </button>
                </div>
              </div>

              {/* Show Action Inputs */}
              {formData.text_message && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
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
                      className="text-xs text-error-600 hover:text-error-800"
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
                      className="text-xs text-error-600 hover:text-error-800"
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

              {/* Bill of Material Table */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Bill of Material Table</p>
                  <button
                    type="button"
                    className="px-3 py-1 bg-primary-100 text-error-700 rounded-lg text-xs font-semibold hover:bg-primary-200 transition"
                  >
                    create log sheet
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase border-b border-slate-100">
                        <th className="p-2">no</th>
                        <th className="p-2">item</th>
                        <th className="p-2">unit</th>
                        <th className="p-2">quantity</th>
                        <th className="p-2">u.price</th>
                        <th className="p-2">t.price</th>
                        <th className="p-2">action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {formData.bom_items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.item}
                              onChange={(e) => {
                                const newItems = [...formData.bom_items]
                                newItems[index].item = e.target.value
                                setFormData({...formData, bom_items: newItems})
                              }}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => {
                                const newItems = [...formData.bom_items]
                                newItems[index].unit = e.target.value
                                setFormData({...formData, bom_items: newItems})
                              }}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...formData.bom_items]
                                newItems[index].quantity = e.target.value
                                setFormData({...formData, bom_items: newItems})
                              }}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.u_price}
                              onChange={(e) => {
                                const newItems = [...formData.bom_items]
                                newItems[index].u_price = e.target.value
                                setFormData({...formData, bom_items: newItems})
                              }}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.t_price}
                              onChange={(e) => {
                                const newItems = [...formData.bom_items]
                                newItems[index].t_price = e.target.value
                                setFormData({...formData, bom_items: newItems})
                              }}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = formData.bom_items.filter((_, i) => i !== index)
                                setFormData({...formData, bom_items: newItems.length > 0 ? newItems : [{ no: 1, item: '', unit: '', quantity: '', u_price: '', t_price: '' }]})
                              }}
                              className="px-2 py-1 bg-primary-100 text-error-600 rounded text-xs hover:bg-primary-200 transition"
                              title="Remove row"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    bom_items: [...formData.bom_items, { no: formData.bom_items.length + 1, item: '', unit: '', quantity: '', u_price: '', t_price: '' }]
                  })}
                  className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
                >
                  [ add ]
                </button>
                <div className="mt-3 flex justify-end">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase mr-2">GT.price:</span>
                    <span className="text-sm font-bold text-slate-800">[ Grand Total Price ]</span>
                  </div>
                </div>
              </div>

              {/* Approval Section */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Approval Section</p>
                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
                  >
                    [ summit ]
                  </button>
                  <p className="text-xs text-slate-400 italic">
                    *Note: "here when aproval is given files will be shared directly to machine operation and finishing operation."
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal for Admin */}
      {isDetailModalOpen && selectedDesign && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedDesign(null)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-eye text-error-500 mr-2"></i>Design Log Details
              </h3>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedDesign(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Design Reference</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDesign.design_reference}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Design Date</p>
                  <p className="text-sm text-slate-600">{selectedDesign.design_date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Priority</p>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    selectedDesign.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedDesign.priority}
                  </span>
                </div>
              </div>

              {/* Project Title */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Project Title</p>
                <p className="text-sm font-semibold text-slate-800">{selectedDesign.project_title}</p>
              </div>

              {/* Machining Options */}
              {selectedDesign.machine_routes && selectedDesign.machine_routes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Machining Options</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(selectedDesign.machine_routes) ? selectedDesign.machine_routes.map((option, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-50 text-error-600 rounded-lg text-xs font-semibold">
                        {option}
                      </span>
                    )) : selectedDesign.machine_routes.split(',').map((option, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-50 text-error-600 rounded-lg text-xs font-semibold">
                        {option.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Inputs Section */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Action Inputs</p>
                
                {/* Text Message */}
                {selectedDesign.text_message && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-semibold text-error-800">
                        <i className="fa-solid fa-font mr-1"></i>Text Message
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedDesign.text_message)
                          alert('Text copied to clipboard!')
                        }}
                        className="text-xs text-error-600 hover:text-error-800"
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </div>
                    <p className="text-sm text-error-600 whitespace-pre-wrap">{selectedDesign.text_message}</p>
                  </div>
                )}

                {/* Voice Note */}
                {selectedDesign.voice_note && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-primary-800 mb-2">
                      <i className="fa-solid fa-microphone mr-1"></i>Voice Note
                    </p>
                    <div className="flex items-center gap-3">
                      {selectedDesign.voice_note_url ? (
                        <>
                          <audio 
                            ref={(audio) => {
                              if (audio) {
                                audio.onplay = () => setIsPlayingVoice(true)
                                audio.onpause = () => setIsPlayingVoice(false)
                                audio.onended = () => setIsPlayingVoice(false)
                              }
                            }}
                            src={selectedDesign.voice_note_url}
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
                      <span className="text-xs text-primary-600">{selectedDesign.voice_note}</span>
                    </div>
                  </div>
                )}

                {/* Attached File */}
                {selectedDesign.attached_file && (
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
                          if (selectedDesign.attached_file_url) {
                            const link = document.createElement('a')
                            link.href = selectedDesign.attached_file_url
                            link.download = selectedDesign.attached_file
                            link.click()
                          } else {
                            alert('File data not available for download')
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                      >
                        <i className="fa-solid fa-download mr-1"></i>Download
                      </button>
                      <span className="text-xs text-primary-600">{selectedDesign.attached_file}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isCreativeAdmin && (
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                  <button
                    onClick={handleRejectWithDetails}
                    disabled={selectedDesign.status === 'Approved' || selectedDesign.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedDesign.status === 'Approved' || selectedDesign.status === 'Rejected'
                        ? 'bg-primary-200 text-error-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <i className="fa-solid fa-times mr-2"></i>Reject
                  </button>
                  <button
                    onClick={handleApproveWithDetails}
                    disabled={selectedDesign.status === 'Approved' || selectedDesign.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedDesign.status === 'Approved' || selectedDesign.status === 'Rejected'
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
      {isFileViewerOpen && selectedDesign?.attached_file && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsFileViewerOpen(false)
              setSelectedDesign(null)
            }}
          ></div>
          <div className="bg-white w-11/12 max-w-4xl mx-auto rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-file-arrow-up text-primary-500 mr-2"></i>File Viewer
              </h3>
              <button 
                onClick={() => {
                  setIsFileViewerOpen(false)
                  setSelectedDesign(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              {selectedDesign.attached_file_url && selectedDesign.attached_file_url.startsWith('data:') ? (
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  {selectedDesign.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={selectedDesign.attached_file_url} 
                      alt={selectedDesign.attached_file}
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                      <p className="text-sm font-semibold text-slate-700 mb-2">{selectedDesign.attached_file}</p>
                      <p className="text-xs text-slate-500 mb-4">File preview available for images only</p>
                    </>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = selectedDesign.attached_file_url
                        link.download = selectedDesign.attached_file
                        link.click()
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                    >
                      <i className="fa-solid fa-download mr-2"></i>Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{selectedDesign.attached_file}</p>
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

export default DesignTab