import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'

const BudgetTab = ({ isActive, searchQuery, onDataChange }) => {
  const { isCreativeAdmin } = useCreativeAuth()
  const [budgets, setBudgets] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [formData, setFormData] = useState({
    request_date: '',
    requester_name: '',
    department: '',
    budget_type: 'operational',
    amount: '',
    description: '',
    justification: '',
    needed_by: '',
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
      fetchBudgets()
    }
  }, [isActive])

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching budgets:', error)
        setBudgets([])
      } else {
        setBudgets(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setBudgets([])
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
      .from('budget_requests')
      .insert([{
        request_date: formData.request_date,
        requester_name: formData.requester_name,
        department: formData.department,
        budget_type: formData.budget_type,
        amount: formData.amount,
        description: formData.description,
        justification: formData.justification,
        needed_by: formData.needed_by,
        status: 'Pending',
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      }])
    
    if (error) {
      console.error('Error adding budget:', error)
      alert('Error adding budget request')
    } else {
      setIsModalOpen(false)
      setFormData({
        request_date: '',
        requester_name: '',
        department: '',
        budget_type: 'operational',
        amount: '',
        description: '',
        justification: '',
        needed_by: '',
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: ''
      })
      fetchBudgets()
      if (onDataChange) onDataChange()
      alert('Budget request submitted successfully!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this budget request?')) return
    
    const { error } = await supabase
      .from('budget_requests')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting budget:', error)
      alert('Error deleting budget request')
    } else {
      fetchBudgets()
      if (onDataChange) onDataChange()
      alert('Budget request deleted successfully!')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    const { error } = await supabase
      .from('budget_requests')
      .update({ status: newStatus })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } else {
      fetchBudgets()
      if (onDataChange) onDataChange()
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

  const handleViewDetails = async (budget) => {
    setSelectedBudget(budget)
    setIsDetailModalOpen(true)
  }

  const handleApproveWithDetails = async () => {
    await handleStatusUpdate(selectedBudget.id, 'Approved')
    setIsDetailModalOpen(false)
    setSelectedBudget(null)
  }

  const handleRejectWithDetails = async () => {
    await handleStatusUpdate(selectedBudget.id, 'Rejected')
    setIsDetailModalOpen(false)
    setSelectedBudget(null)
  }

  const handleEdit = (budget) => {
    setFormData({
      request_date: budget.request_date,
      requester_name: budget.requester_name,
      department: budget.department,
      budget_type: budget.budget_type,
      amount: budget.amount,
      description: budget.description,
      justification: budget.justification,
      needed_by: budget.needed_by,
      text_message: budget.text_message || '',
      voice_note: budget.voice_note || '',
      voice_note_url: budget.voice_note_url || '',
      attached_file: budget.attached_file || null,
      attached_file_url: budget.attached_file_url || ''
    })
    setEditingId(budget.id)
    setIsModalOpen(true)
  }

  const handleUpdate = async (e) => {
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
    
    const { error } = await supabase
      .from('budget_requests')
      .update({
        request_date: formData.request_date,
        requester_name: formData.requester_name,
        department: formData.department,
        budget_type: formData.budget_type,
        amount: formData.amount,
        description: formData.description,
        justification: formData.justification,
        needed_by: formData.needed_by,
        text_message: formData.text_message,
        voice_note: formData.voice_note,
        voice_note_url: formData.voice_note_url,
        attached_file: formData.attached_file,
        attached_file_url: formData.attached_file_url
      })
      .eq('id', editingId)
    
    if (error) {
      console.error('Error updating budget:', error)
      alert('Error updating budget request')
    } else {
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({
        request_date: '',
        requester_name: '',
        department: '',
        budget_type: 'operational',
        amount: '',
        description: '',
        justification: '',
        needed_by: '',
        text_message: '',
        voice_note: '',
        voice_note_url: '',
        attached_file: null,
        attached_file_url: ''
      })
      fetchBudgets()
      if (onDataChange) onDataChange()
      alert('Budget request updated successfully!')
    }
  }

  const filteredBudgets = budgets.filter(budget => 
    Object.values(budget).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (!isActive) return null

  return (
    <div className="tab-content active space-y-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-primary-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-primary-200 flex justify-between items-center bg-primary-50/50">
          <div>
            <h3 className="font-bold text-secondary-900 text-lg">Budget & Expenses</h3>
            <p className="text-xs text-secondary-500 mt-0.5">Manage budget and expense requests</p>
          </div>
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
            className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition"
          >
            <i className="fa-solid fa-plus mr-1"></i> Add New
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dynamic-target-table">
            <thead>
              <tr className="bg-primary-50 text-secondary-500 font-bold text-xs uppercase border-b border-primary-200 tracking-wider">
                <th className="p-4">request date</th>
                <th className="p-4">requester</th>
                <th className="p-4">department</th>
                <th className="p-4">type</th>
                <th className="p-4">amount</th>
                <th className="p-4">needed by</th>
                <th className="p-4">status</th>
                <th className="p-4">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 text-xs text-secondary-700 font-medium">
              {filteredBudgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-primary-50/60 transition">
                  <td className="p-4 font-semibold">{budget.request_date}</td>
                  <td className="p-4 font-bold text-secondary-900">{budget.requester_name}</td>
                  <td className="p-4">{budget.department}</td>
                  <td className="p-4">{budget.budget_type}</td>
                  <td className="p-4 font-extrabold text-secondary-900">{Number(budget.amount).toLocaleString()} ETB</td>
                  <td className="p-4">{budget.needed_by}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      budget.status === 'Approved' ? 'bg-success-50 text-success-600' :
                      budget.status === 'Rejected' ? 'bg-error-50 text-primary-600' :
                      budget.status === 'Under Review' ? 'bg-primary-50 text-primary-600' :
                      'bg-warning-50 text-warning-600'
                    }`}>
                      {budget.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="px-2 py-1 bg-secondary-100 text-secondary-600 rounded hover:bg-secondary-200 transition"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {isCreativeAdmin && (
                        <>
                          <button
                            onClick={() => handleViewDetails(budget)}
                            className="px-2 py-1 bg-accent-100 text-accent-600 rounded hover:bg-accent-200 transition"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(budget.id, 'Approved')}
                            disabled={budget.status === 'Approved' || budget.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              budget.status === 'Approved' || budget.status === 'Rejected'
                                ? 'bg-success-50 text-success-300 cursor-not-allowed'
                                : 'bg-success-100 text-success-600 hover:bg-success-200'
                            }`}
                            title="Approve"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(budget.id, 'Rejected')}
                            disabled={budget.status === 'Approved' || budget.status === 'Rejected'}
                            className={`px-2 py-1 rounded transition ${
                              budget.status === 'Approved' || budget.status === 'Rejected'
                                ? 'bg-error-50 text-primary-300 cursor-not-allowed'
                                : 'bg-error-100 text-primary-600 hover:bg-error-200'
                            }`}
                            title="Reject"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="px-2 py-1 bg-error-100 text-primary-600 rounded hover:bg-error-200 transition"
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
            className="modal-overlay absolute w-full h-full bg-secondary-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white/80 backdrop-blur-sm w-11/12 max-w-lg mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-primary-200 flex justify-between items-center bg-primary-50">
              <h3 className="font-bold text-secondary-900 text-sm">
                <i className="fa-solid fa-money-bill text-primary-500 mr-2"></i>Budget & Expenses
              </h3>
              <button
                onClick={() => {
                  if (formData.voice_note_url) {
                    URL.revokeObjectURL(formData.voice_note_url)
                  }
                  if (formData.attached_file_url) {
                    URL.revokeObjectURL(formData.attached_file_url)
                  }
                  setIsModalOpen(false)
                }}
                className="text-secondary-400 hover:text-secondary-600 text-xl">&times;</button>
            </div>
            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="p-5 space-y-4 shadow-inner">
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">request date</label>
                <input
                  type="date"
                  required
                  value={formData.request_date}
                  onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                  className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">requester name</label>
                <input
                  type="text"
                  required
                  value={formData.requester_name}
                  onChange={(e) => setFormData({...formData, requester_name: e.target.value})}
                  className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Department"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">budget type</label>
                  <select
                    required
                    value={formData.budget_type}
                    onChange={(e) => setFormData({...formData, budget_type: e.target.value})}
                    className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="operational">Operational</option>
                    <option value="capital">Capital</option>
                    <option value="project">Project</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">amount</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Amount in ETB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">needed by</label>
                  <input
                    type="date"
                    required
                    value={formData.needed_by}
                    onChange={(e) => setFormData({...formData, needed_by: e.target.value})}
                    className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">description</label>
                <textarea
                  required
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">justification</label>
                <textarea
                  required
                  rows="3"
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className="w-full border border-primary-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Detailed justification"
                />
              </div>

              {/* Action Inputs */}
              <div className="border-t border-primary-200 pt-4">
                <p className="text-xs font-bold text-secondary-500 uppercase mb-3">Action Inputs</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={handleTextAction}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-xs font-semibold hover:bg-primary-200 transition"
                  >
                    <i className="fa-solid fa-font mr-2"></i>text
                  </button>
                  <button
                    type="button"
                    onClick={handleVoiceAction}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                      isRecording ? 'bg-error-100 text-primary-700' : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                    }`}
                  >
                    <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>
                    {isRecording ? `voice (${recordingTime}s)` : 'voice'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFileAction}
                    className="px-4 py-2 bg-success-100 text-success-700 rounded-xl text-xs font-semibold hover:bg-success-200 transition"
                  >
                    <i className="fa-solid fa-file-arrow-up mr-2"></i>file
                  </button>
                </div>
              </div>

              {/* Show Action Inputs */}
              {formData.text_message && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-semibold text-primary-800">Text Message:</p>
                    <button
                      onClick={() => setFormData({...formData, text_message: ''})}
                      className="text-xs text-primary-600 hover:text-primary-800"
                      title="Remove text"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  <p className="text-xs text-primary-600 whitespace-pre-wrap">{formData.text_message}</p>
                </div>
              )}

              {formData.voice_note && (
                <div className="p-3 bg-accent-50 rounded-lg border border-accent-200">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-semibold text-accent-800">Voice Note:</p>
                    <button
                      onClick={() => {
                        if (formData.voice_note_url) {
                          URL.revokeObjectURL(formData.voice_note_url)
                        }
                        setFormData({...formData, voice_note: '', voice_note_url: ''})
                        alert('Voice note removed')
                      }}
                      className="text-xs text-primary-600 hover:text-primary-800"
                      title="Remove voice note"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  <p className="text-xs text-accent-600">{formData.voice_note}</p>
                  {formData.voice_note_url && (
                    <audio src={formData.voice_note_url} controls className="w-full mt-2 h-8" />
                  )}
                </div>
              )}

              {formData.attached_file && (
                <div className="p-3 bg-success-50 rounded-lg border border-success-200">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-semibold text-success-800">Attached File:</p>
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
                  <p className="text-xs text-success-600">{formData.attached_file}</p>
                  {formData.attached_file_url && formData.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                    <img
                      src={formData.attached_file_url}
                      alt={formData.attached_file}
                      className="max-w-full max-h-32 object-contain mt-2 rounded-lg"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-primary-200">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition"
                >
                  {editingId ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedBudget && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div
            className="modal-overlay absolute w-full h-full bg-secondary-900/40 backdrop-blur-sm"
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedBudget(null)
            }}
          ></div>
          <div className="bg-white/80 backdrop-blur-sm w-11/12 max-w-2xl mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-primary-200 flex justify-between items-center bg-primary-50">
              <h3 className="font-bold text-secondary-900 text-sm">
                <i className="fa-solid fa-eye text-accent-500 mr-2"></i>Budget Request Details
              </h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedBudget(null)
                }}
                className="text-secondary-400 hover:text-secondary-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Request Date</p>
                  <p className="text-sm text-slate-600">{selectedBudget.request_date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Requester Name</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedBudget.requester_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Department</p>
                  <p className="text-sm text-slate-600">{selectedBudget.department}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Budget Type</p>
                  <p className="text-sm text-slate-600">{selectedBudget.budget_type}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Amount</p>
                  <p className="text-sm font-extrabold text-slate-800">{Number(selectedBudget.amount).toLocaleString()} ETB</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Needed By</p>
                  <p className="text-sm text-slate-600">{selectedBudget.needed_by}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status</p>
                  <span className={`px-2.5 py-1 rounded-full font-semibold text-sm ${
                    selectedBudget.status === 'Approved' ? 'bg-primary-50 text-primary-600' :
                    selectedBudget.status === 'Rejected' ? 'bg-red-50 text-primary-600' :
                    selectedBudget.status === 'Under Review' ? 'bg-primary-50 text-primary-600' :
                    'bg-primary-50 text-primary-600'
                  }`}>
                    {selectedBudget.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedBudget.description}</p>
              </div>

              {/* Justification */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Justification</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedBudget.justification}</p>
              </div>

              {/* Action Inputs Section */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Action Inputs</p>
                
                {/* Text Message */}
                {selectedBudget.text_message && (
                  <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-semibold text-primary-800">
                        <i className="fa-solid fa-font mr-1"></i>Text Message
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedBudget.text_message)
                          alert('Text copied to clipboard!')
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800"
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </div>
                    <p className="text-sm text-primary-600 whitespace-pre-wrap">{selectedBudget.text_message}</p>
                  </div>
                )}

                {/* Voice Note */}
                {selectedBudget.voice_note && (
                  <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-2">
                      <i className="fa-solid fa-microphone mr-1"></i>Voice Note
                    </p>
                    <div className="flex items-center gap-3">
                      {selectedBudget.voice_note_url ? (
                        <>
                          <audio 
                            ref={(audio) => {
                              if (audio) {
                                audio.onplay = () => setIsPlayingVoice(true)
                                audio.onpause = () => setIsPlayingVoice(false)
                                audio.onended = () => setIsPlayingVoice(false)
                              }
                            }}
                            src={selectedBudget.voice_note_url}
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
                      <span className="text-xs text-purple-600">{selectedBudget.voice_note}</span>
                    </div>
                  </div>
                )}

                {/* Attached File */}
                {selectedBudget.attached_file && (
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
                          if (selectedBudget.attached_file_url) {
                            const link = document.createElement('a')
                            link.href = selectedBudget.attached_file_url
                            link.download = selectedBudget.attached_file
                            link.click()
                          } else {
                            alert('File data not available for download')
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition"
                      >
                        <i className="fa-solid fa-download mr-1"></i>Download
                      </button>
                      <span className="text-xs text-green-600">{selectedBudget.attached_file}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isCreativeAdmin && (
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                  <button
                    onClick={handleRejectWithDetails}
                    disabled={selectedBudget.status === 'Approved' || selectedBudget.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedBudget.status === 'Approved' || selectedBudget.status === 'Rejected'
                        ? 'bg-red-200 text-primary-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <i className="fa-solid fa-times mr-2"></i>Reject
                  </button>
                  <button
                    onClick={handleApproveWithDetails}
                    disabled={selectedBudget.status === 'Approved' || selectedBudget.status === 'Rejected'}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedBudget.status === 'Approved' || selectedBudget.status === 'Rejected'
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
      {isFileViewerOpen && selectedBudget?.attached_file && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              setIsFileViewerOpen(false)
              setSelectedBudget(null)
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
                  setSelectedBudget(null)
                }} 
                className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              {selectedBudget.attached_file_url && selectedBudget.attached_file_url.startsWith('data:') ? (
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                  {selectedBudget.attached_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={selectedBudget.attached_file_url} 
                      alt={selectedBudget.attached_file}
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <i className="fa-solid fa-file-lines text-6xl text-slate-400 mb-4"></i>
                      <p className="text-sm font-semibold text-slate-700 mb-2">{selectedBudget.attached_file}</p>
                      <p className="text-xs text-slate-500 mb-4">File preview available for images only</p>
                    </>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = selectedBudget.attached_file_url
                        link.download = selectedBudget.attached_file
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
                  <p className="text-sm font-semibold text-slate-700 mb-2">{selectedBudget.attached_file}</p>
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

export default BudgetTab