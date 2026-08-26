import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const MessagesTab = ({ isActive, searchQuery }) => {
  const [messages, setMessages] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    recipient: '',
    message: ''
  })

  useEffect(() => {
    if (isActive) {
      fetchMessages()
    }
  }, [isActive])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender: 'Me',
        recipient: formData.recipient,
        message: formData.message,
        read_status: false
      }])
    
    if (error) {
      console.error('Error adding message:', error)
    } else {
      setIsModalOpen(false)
      setFormData({ recipient: '', message: '' })
      fetchMessages()
    }
  }

  const filteredMessages = messages.filter(msg => 
    Object.values(msg).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (!isActive) return <div className="hidden"></div>

  return (
    <div className={`tab-content ${isActive ? 'active' : ''} space-y-4`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Messages</h3>
            <p className="text-xs text-slate-400 mt-0.5">Internal communication and team messages</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
          >
            <i className="fa-solid fa-plus mr-1"></i> New Message
          </button>
        </div>
        <div className="p-5 space-y-4">
          {filteredMessages.map((msg) => (
            <div key={msg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xs">
                    {msg.sender.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{msg.sender}</p>
                    <p className="text-xs text-slate-500">{msg.timestamp}</p>
                  </div>
                </div>
                {!msg.read_status && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">New</span>
                )}
              </div>
              <p className="text-sm text-slate-600">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal opacity-100 pointer-events-auto fixed w-full h-full top-0 left-0 flex items-center justify-center z-50">
          <div 
            className="modal-overlay absolute w-full h-full bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white w-11/12 max-w-lg mx-auto rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fa-solid fa-envelope text-primary-500 mr-2"></i>Send New Message
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient</label>
                <input
                  type="text"
                  required
                  placeholder="Enter recipient name"
                  value={formData.recipient}
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Type your message..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-xs"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesTab