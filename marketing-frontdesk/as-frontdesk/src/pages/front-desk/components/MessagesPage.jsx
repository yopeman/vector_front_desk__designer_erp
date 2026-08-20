import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function MessagesPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [notificationModal, setNotificationModal] = useState({
    show: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;

    let channel;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId}))`
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              fetchMessages(selectedUser.id);
              if (payload.new.sender_id !== currentUserId) {
                setNotificationModal({
                  show: true,
                  title: 'New Message',
                  message: `You have a new message from ${selectedUser.username}`
                });
              }
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [selectedUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users!messages_sender_id_fkey(username, email), receiver:users!messages_receiver_id_fkey(username, email)')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch attached files for messages that have them
      const messagesWithFiles = data || [];
      const fileIds = new Set();
      messagesWithFiles.forEach(msg => {
        (msg.attached_file_ids || []).forEach(id => fileIds.add(id));
      });

      let filesMap = {};
      if (fileIds.size > 0) {
        const { data: filesData } = await supabase
          .from('files')
          .select('id, name, path, mime_type, file_size')
          .in('id', Array.from(fileIds));

        if (filesData) {
          filesData.forEach(f => { filesMap[f.id] = f; });
        }
      }

      const enrichedMessages = messagesWithFiles.map(msg => ({
        ...msg,
        attached_files: (msg.attached_file_ids || []).map(id => filesMap[id]).filter(Boolean)
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!text.trim() && attachments.length === 0) || !selectedUser || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      let fileIds = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
          const { data: uploadData, error: upErr } = await supabase.storage
            .from('documents')
            .upload(filePath, file);
          if (upErr) throw upErr;

          const storedPath = uploadData?.path || filePath;

          const { data: fileData, error: fileErr } = await supabase
            .from('files')
            .insert({
              name: file.name,
              path: storedPath,
              mime_type: file.type,
              file_size: file.size,
              uploaded_by: currentUserId,
            })
            .select('id')
            .single();
          if (fileErr) throw fileErr;
          fileIds.push(fileData.id);
        }
      }

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: currentUserId,
            receiver_id: selectedUser.id,
            text: text.trim(),
            attached_file_ids: fileIds,
            sent_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      setText('');
      setAttachments([]);
      await fetchMessages(selectedUser.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
  };

  const downloadFile = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file: ' + error.message);
    }
  };

  const getOtherUser = (message) => {
    if (message.sender_id === profile?.id) {
      return message.receiver;
    }
    return message.sender;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', backgroundColor: '#f0f2f5' }}>
      {/* User List Sidebar */}
      <div style={{
        width: '300px',
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 700,
          fontSize: '16px',
          color: '#1a1a2e'
        }}>
          <i className="fa-solid fa-message" style={{ marginRight: '8px', color: '#2563eb' }}></i>
          Messages
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: selectedUser?.id === user.id ? '#e8f0fe' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => {
                if (selectedUser?.id !== user.id) {
                  e.currentTarget.style.backgroundColor = '#f8f8f8';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedUser?.id !== user.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0
              }}>
                {(user.username || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
              {user.role && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: user.role === 'admin' ? '#fef3c7' : user.role === 'designer' ? '#dbeafe' : '#d1fae5',
                  color: user.role === 'admin' ? '#92400e' : user.role === 'designer' ? '#1e40af' : '#065f46',
                  fontWeight: 600
                }}>
                  {user.role}
                </span>
              )}
            </div>
          ))}
          {users.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px'
              }}>
                {(selectedUser.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>
                  {selectedUser.username}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>{selectedUser.email}</div>
              </div>
            </div>

            {/* Messages List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid #e2e8f0',
                    borderTop: '3px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                  <i className="fa-regular fa-comment-dots" style={{ fontSize: '48px', marginBottom: '16px', display: 'block', color: '#cbd5e1' }}></i>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>No messages yet</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Send a message to {selectedUser.username}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === profile?.id;
                  const otherUser = getOtherUser(msg);
                  const showSenderName = idx === 0 || (messages[idx - 1]?.sender_id !== msg.sender_id);

                  return (
                    <div key={msg.id} style={{
                      display: 'flex',
                      flexDirection: isOwn ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      {!isOwn && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '11px',
                          flexShrink: 0
                        }}>
                          {(otherUser?.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '65%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start'
                      }}>
                        {!isOwn && showSenderName && (
                          <span style={{ fontSize: '11px', color: '#888', marginBottom: '4px', marginLeft: '8px' }}>
                            {otherUser?.username || 'Unknown'}
                          </span>
                        )}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '16px',
                          backgroundColor: isOwn ? '#2563eb' : '#fff',
                          color: isOwn ? '#fff' : '#1a1a2e',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          wordBreak: 'break-word'
                        }}>
                          {msg.text && (
                            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{msg.text}</div>
                          )}
                          {msg.attached_file_ids && msg.attached_file_ids.length > 0 && (
                            <div style={{ marginTop: msg.text ? '8px' : 0 }}>
                              {(msg.attached_files || []).map((file) => (
                                <div
                                  key={file.id}
                                  onClick={() => downloadFile(file.path, file.name)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : '#f8f8f8',
                                    borderRadius: '8px',
                                    marginTop: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isOwn ? 'rgba(255,255,255,0.25)' : '#eef2f7';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isOwn ? 'rgba(255,255,255,0.15)' : '#f8f8f8';
                                  }}
                                >
                                  <i className="fa-solid fa-file" style={{ color: isOwn ? 'rgba(255,255,255,0.8)' : '#2563eb', fontSize: '14px' }}></i>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {file.name}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                      {formatFileSize(file.file_size)}
                                    </div>
                                  </div>
                                  <i className="fa-solid fa-download" style={{ fontSize: '11px', opacity: 0.6 }}></i>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: '#aaa',
                          marginTop: '4px',
                          paddingLeft: isOwn ? 0 : '40px'
                        }}>
                          {formatTime(msg.sent_at || msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div style={{
                padding: '8px 20px',
                backgroundColor: '#fff',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: '#f0f4ff',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: '1px solid #d0d7ff'
                    }}
                  >
                    <i className="fa-solid fa-file" style={{ color: '#2563eb' }}></i>
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '12px',
                        padding: '0 2px'
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Input */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '10px'
            }}>
              <label htmlFor="msg-file-input" style={{ cursor: 'pointer' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f2f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '16px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f2f5'}
                >
                  <i className="fa-solid fa-paperclip"></i>
                </div>
                <input
                  id="msg-file-input"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                  maxHeight: '100px',
                  fontFamily: 'inherit',
                  lineHeight: 1.5
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || (!text.trim() && attachments.length === 0)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: sending || (!text.trim() && attachments.length === 0) ? '#94a3b8' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s'
                }}
              >
                {sending ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-paper-plane"></i>
                )}
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888'
          }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fa-regular fa-comment-dots" style={{ fontSize: '48px', marginBottom: '16px', display: 'block', color: '#cbd5e1' }}></i>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>Select a user to start messaging</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Choose a user from the list on the left</p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {notificationModal.show && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setNotificationModal({ ...notificationModal, show: false })}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <i className="fa-solid fa-bell text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{notificationModal.title}</h3>
                  <p className="text-sm text-slate-600">{notificationModal.message}</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationModal({ ...notificationModal, show: false })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}