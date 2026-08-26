import React, { useState, useEffect, useRef, useMemo } from 'react';
import { sendCreativeMessage, getCreativeConversation, getCreativeUserConversations, markCreativeMessagesAsRead, subscribeToCreativeConversation, unsubscribeFromCreativeChannel, getCreativeUsers, getUserIdFromEmail } from '../lib/creativeMessageService';
import { useCreativeAuth } from '../contexts/CreativeAuthContext';
import { supabase } from '../lib/supabaseClient';

const CreativeChat = ({ isActive }) => {
  const { user, isCreativeAdmin } = useCreativeAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);


  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    if (isActive && user) {
      loadConversations();
      loadAvailableUsers();
    }
  }, [isActive, user]);

  // Load conversation when selected
  useEffect(() => {
    if (selectedConversation) {
      // Check if the conversation has a valid UUID (not an email)
      if (selectedConversation.other_user_id.includes('@')) {
        console.warn('Invalid conversation ID (email instead of UUID), clearing selection:', selectedConversation.other_user_id);
        setSelectedConversation(null);
        return;
      }
      loadMessages(selectedConversation.other_user_id);
      markCreativeMessagesAsRead(selectedConversation.other_user_id, user.id);
    }
  }, [selectedConversation, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (selectedConversation) {
      subscriptionRef.current = subscribeToCreativeConversation(
        user.id,
        selectedConversation.other_user_id,
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new]);
            loadConversations();
          }
        }
      );
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromCreativeChannel(subscriptionRef.current);
      }
    };
  }, [selectedConversation, user]);

  const loadConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await getCreativeUserConversations(user.id);
    if (result.success) {
      console.log('Loaded creative conversations:', result.data.length);
      setConversations(result.data);
    } else {
      console.error('Error loading creative conversations:', result.error);
    }
    setLoading(false);
  };

  // Combine available users with existing conversations
  const allChatContacts = useMemo(() => {
    const contactMap = new Map();
    
    // Add existing conversations
    conversations.forEach(conv => {
      contactMap.set(conv.other_user_id, conv);
    });
    
    // Add available users who don't have conversations yet
    availableUsers.forEach(u => {
      const actualUserId = u.id; // Use the actual UUID from the user data
      if (!contactMap.has(actualUserId)) {
        contactMap.set(actualUserId, {
          other_user_id: actualUserId,
          other_user_name: u.user_metadata?.full_name || u.email,
          other_user_email: u.email,
          last_message: 'Start a conversation...',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        });
      }
    });
    
    return Array.from(contactMap.values());
  }, [conversations, availableUsers]);

  const loadAvailableUsers = async () => {
    if (!user) return;
    
    try {
      const result = await getCreativeUsers(user.id);
      if (result.success) {
        setAvailableUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const startNewConversation = async (selectedUser) => {
    const actualUserId = selectedUser.id;
    
    const existingConv = conversations.find(c => c.other_user_id === actualUserId);
    if (existingConv) {
      setSelectedConversation(existingConv);
      return;
    }

    const newConv = {
      other_user_id: actualUserId,
      other_user_name: selectedUser.user_metadata?.full_name || selectedUser.email,
      other_user_email: selectedUser.email,
      last_message: 'Start a conversation...',
      last_message_time: new Date().toISOString(),
      unread_count: 0
    };
    
    setSelectedConversation(newConv);
  };

  const loadMessages = async (otherUserId) => {
    const result = await getCreativeConversation(user.id, otherUserId);
    if (result.success) {
      setMessages(result.data);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) {
      console.log('Cannot send: no message or no conversation selected');
      return;
    }

    console.log('Sending creative message:', {
      from: user.id,
      to: selectedConversation.other_user_id,
      message: newMessage
    });
    
    try {
      // Resolve receiver ID if it's an email (legacy data)
      let receiverId = selectedConversation.other_user_id;
      if (receiverId.includes('@')) {
        console.log('Receiver ID is an email, attempting to resolve:', receiverId);
        const resolvedId = await getUserIdFromEmail(selectedConversation.other_user_email);
        console.log('Resolved ID:', resolvedId);
        if (resolvedId && !resolvedId.includes('@')) {
          receiverId = resolvedId;
          // Update the conversation with the resolved UUID
          setSelectedConversation({
            ...selectedConversation,
            other_user_id: resolvedId
          });
        } else {
          alert('Cannot send message: User does not exist in the system. Please contact an administrator.');
          return;
        }
      }
      
      const result = await sendCreativeMessage(user.id, receiverId, newMessage);
      console.log('Send result:', result);
      if (result.success) {
        setNewMessage('');
        await loadMessages(receiverId);
        await loadConversations();
      } else {
        console.error('Failed to send message:', result.error);
        alert('Failed to send message: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  };




  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };



  if (!isActive) return null;

  return (
    <div className="tab-content active space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Messages</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chat with creative team members directly</p>
          </div>
        </div>

        <div className="flex h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <div className="w-full md:w-80 border-r border-slate-100 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading conversations...</p>
                </div>
              ) : allChatContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <i className="fa-solid fa-comments text-4xl mb-2 text-slate-300"></i>
                  <p>No contacts available</p>
                </div>
              ) : (
                allChatContacts
                  .filter(contact => 
                    contact.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    contact.other_user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    contact.last_message.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((contact) => (
                    <div
                      key={contact.other_user_id}
                      onClick={() => setSelectedConversation(contact)}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition ${
                        selectedConversation?.other_user_id === contact.other_user_id ? 'bg-primary-50 border-l-4 border-l-cyan-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {contact.other_user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800 text-sm truncate">{contact.other_user_name}</p>
                            <span className="text-xs text-slate-400">{formatTime(contact.last_message_time)}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{contact.last_message}</p>
                        </div>
                        {contact.unread_count > 0 && (
                          <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                            {contact.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {selectedConversation.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{selectedConversation.other_user_name}</p>
                      <p className="text-xs text-slate-500">{selectedConversation.other_user_email}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <i className="fa-solid fa-paper-plane text-4xl mb-2 text-slate-300"></i>
                        <p>Start a conversation</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${
                          msg.sender_id === user.id 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-slate-100 text-slate-800'
                        } rounded-2xl px-4 py-2`}>
                          <p className="text-sm">{msg.text}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className={`text-xs ${
                              msg.sender_id === user.id ? 'text-primary-100' : 'text-slate-400'
                            }`}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <i className="fa-solid fa-comments text-6xl mb-4 text-slate-300"></i>
                  <p className="text-lg font-semibold">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CreativeChat;