import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useMessages, useUsers } from '../../lib/hooks/useMessages'
import { messagesApi } from '../../lib/api/messages'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Plus, Send, Trash2, Users, User, Paperclip, X, Download } from 'lucide-react'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
  const [messageInput, setMessageInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [notificationModal, setNotificationModal] = useState({
    show: false,
    title: '',
    message: ''
  })

  const { messages, createMessage: createMsg, notification, setNotification } = useMessages(selectedUserId)
  const { users } = useUsers()

  const selectedUser = users.data?.find(u => u.id === selectedUserId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data])

  useEffect(() => {
    if (notification.show) {
      setNotificationModal({
        show: true,
        title: notification.title,
        message: notification.message
      })
      setNotification({ show: false, title: '', message: '' })
    }
  }, [notification, setNotification])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isToday) return timeStr
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr
  }

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const url = await messagesApi.getFileUrl(filePath)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file: ' + (error as Error).message)
    }
  }

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && attachments.length === 0) || !selectedUserId || !user?.id || sending) return

    setSending(true)
    try {
      let filePaths: string[] = []
      if (attachments.length > 0) {
        for (const file of attachments) {
          const filePath = await messagesApi.uploadFile(file)
          filePaths.push(filePath)
        }
      }

      await createMsg.mutateAsync({
        sender_id: user.id,
        receiver_id: selectedUserId,
        text: messageInput.trim(),
        is_read: false,
        attached_file_ids: filePaths.length > 0 ? filePaths : undefined,
      })

      setMessageInput('')
      setAttachments([])
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message: ' + (error as Error).message)
    } finally {
      setSending(false)
    }
  }

  const getUserInitials = (email?: string) => {
    if (!email) return '?'
    return email[0].toUpperCase()
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* User List Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="space-y-1">
            {users.data?.filter(u => u.id !== user?.id).map((userItem) => (
              <div
                key={userItem.id}
                onClick={() => setSelectedUserId(userItem.id)}
                className={`mx-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUserId === userItem.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedUserId === userItem.id ? 'bg-white/20' : 'bg-primary/10'
                  }`}>
                    <span className={`text-sm font-medium ${
                      selectedUserId === userItem.id ? 'text-white' : 'text-primary'
                    }`}>
                      {getUserInitials(userItem.email || userItem.username)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {userItem.username || userItem.email?.split('@')[0] || 'User'}
                    </p>
                    <p className={`text-xs truncate ${
                      selectedUserId === userItem.id ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {userItem.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {users.data?.filter(u => u.id !== user?.id).length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  'bg-primary/10'
                }`}>
                  <span className={`text-sm font-medium text-primary`}>
                    {getUserInitials(selectedUser.email || selectedUser.username)}
                  </span>
                </div>
                {selectedUser.username || selectedUser.email?.split('@')[0] || 'User'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
                {messages.isLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.data?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Send a message to {selectedUser.username || selectedUser.email?.split('@')[0] || 'this user'}</p>
                  </div>
                ) : (
                  messages.data?.map((message, idx) => {
                    const isOwn = message.sender_id === user?.id
                    const otherUser = isOwn ? selectedUser : { email: selectedUser.email, username: selectedUser.username }
                    const showSenderName = !isOwn && (idx === 0 || messages.data?.[idx - 1]?.sender_id !== message.sender_id)

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isOwn && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-primary">
                                {getUserInitials(otherUser?.email || otherUser?.username)}
                              </span>
                            </div>
                          )}
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && showSenderName && (
                              <span className="text-xs text-gray-500 mb-1 ml-1">
                                {otherUser?.username || otherUser?.email || 'Unknown'}
                              </span>
                            )}
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.text && (
                                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                              )}
                              {message.attached_file_ids && message.attached_file_ids.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attached_file_ids.map((filePath: string, fileIdx: number) => {
                                    const fileName = filePath.split('/').pop() || `Attachment ${fileIdx + 1}`
                                    return (
                                      <div
                                        key={fileIdx}
                                        onClick={() => downloadFile(filePath, fileName)}
                                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                          isOwn ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-50 hover:bg-gray-200'
                                        }`}
                                      >
                                        <Paperclip className={`w-3 h-3 ${isOwn ? 'text-white/70' : 'text-gray-500'}`} />
                                        <span className={`text-xs truncate flex-1 ${isOwn ? 'text-white/90' : 'text-gray-700'}`}>
                                          {fileName}
                                        </span>
                                        <Download className={`w-3 h-3 ${isOwn ? 'text-white/50' : 'text-gray-400'}`} />
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] text-gray-400 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 border-t bg-gray-50 flex gap-2 flex-wrap">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs"
                    >
                      <Paperclip className="w-3 h-3 text-primary" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2 items-end">
                  {/* <label htmlFor="msg-file-input" className="cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <input
                      id="msg-file-input"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label> */}
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sending || (!messageInput.trim() && attachments.length === 0)}
                    size="icon"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium">Select a user to start messaging</p>
              <p className="text-sm text-gray-400 mt-1">Choose a user from the list on the left</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notification Modal */}
      {notificationModal.show && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setNotificationModal({ ...notificationModal, show: false })}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{notificationModal.title}</h3>
                  <p className="text-sm text-gray-600">{notificationModal.message}</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationModal({ ...notificationModal, show: false })}
                className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
