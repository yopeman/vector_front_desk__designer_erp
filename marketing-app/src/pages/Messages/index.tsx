import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useConversations, useMessages, useUsers } from '../../lib/hooks/useMessages'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Plus, Send, MoreVertical, Trash2, Users, User } from 'lucide-react'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { conversations, createConversation, deleteConversation } = useConversations(user?.id)
  const { messages, createMessage } = useMessages(selectedConversationId)
  const { users } = useUsers()

  const selectedConversation = conversations.data?.find(c => c.id === selectedConversationId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data])

  const handleCreateConversation = async () => {
    if (!selectedUserId || !user?.id) return

    const participantIds = [user.id, selectedUserId]
    const selectedUser = users.data?.find(u => u.id === selectedUserId)
    const conversationName = selectedUser?.email || 'New Conversation'

    await createConversation.mutateAsync({
      conversation: {
        name: conversationName,
        is_group_chat: false,
        created_by: user.id,
      },
      participantIds,
    })

    setNewChatName('')
    setSelectedUserId(undefined)
    setIsNewChatOpen(false)
  }

  const handleStartConversation = async (userId: string) => {
    if (!user?.id) return

    const participantIds = [user.id, userId]
    const selectedUser = users.data?.find(u => u.id === userId)
    const conversationName = selectedUser?.email || 'New Conversation'

    const newConversation = await createConversation.mutateAsync({
      conversation: {
        name: conversationName,
        is_group_chat: false,
        created_by: user.id,
      },
      participantIds,
    })

    setSelectedConversationId(newConversation.id)
  }

  const handleDeleteConversation = async (id: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation.mutateAsync(id)
      if (selectedConversationId === id) {
        setSelectedConversationId(undefined)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId || !user?.id) return

    await createMessage.mutateAsync({
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: messageInput,
      is_read: false,
    })

    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (conversations.isLoading) {
    return <div className="text-center py-12">Loading conversations...</div>
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Messages</CardTitle>
            <Button size="sm" onClick={() => setIsNewChatOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {conversations.data?.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {conversation.is_group_chat ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {conversation.name?.[0]?.toUpperCase() || 'C'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {conversation.name || 'New Conversation'}
                      </p>
                      <p className="text-xs opacity-70">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conversation.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {conversations.data?.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No conversations yet. Start a new chat!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                {selectedConversation.is_group_chat && <Users className="w-5 h-5" />}
                {selectedConversation.name || 'Conversation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {messages.isLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.data?.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  messages.data?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="pt-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* New Conversation Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {users.isLoading ? (
                  <div className="text-center text-gray-500 py-4">Loading users...</div>
                ) : users.error ? (
                  <div className="text-center text-red-500 py-4">Error loading users: {String(users.error)}</div>
                ) : users.data?.filter(u => u.id !== user?.id).length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No other users available</div>
                ) : (
                  users.data?.filter(u => u.id !== user?.id).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                        selectedUserId === u.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">{u.email}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={!selectedUserId || createConversation.isPending}
              >
                Start Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
