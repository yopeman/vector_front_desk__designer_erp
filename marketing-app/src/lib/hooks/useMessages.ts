import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi, messagesApi, participantsApi, usersApi } from '../api/messages'
import { Conversation, Message } from '../../types/database'

export function useConversations(userId: string | undefined) {
  const queryClient = useQueryClient()

  const conversations = useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => conversationsApi.getAll(userId!),
    enabled: !!userId,
  })

  const createConversation = useMutation({
    mutationFn: ({ conversation, participantIds }: { conversation: any; participantIds: string[] }) =>
      conversationsApi.create(conversation, participantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const updateConversation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Conversation> }) =>
      conversationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const deleteConversation = useMutation({
    mutationFn: conversationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  return {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
  }
}

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  const messages = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesApi.getByConversation(conversationId!),
    enabled: !!conversationId,
  })

  const createMessage = useMutation({
    mutationFn: messagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const updateMessage = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Message> }) =>
      messagesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  const deleteMessage = useMutation({
    mutationFn: messagesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  const markAsRead = useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      messagesApi.markAsRead(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  return {
    messages,
    createMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
  }
}

export function useParticipants(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  const participants = useQuery({
    queryKey: ['participants', conversationId],
    queryFn: () => participantsApi.getByConversation(conversationId!),
    enabled: !!conversationId,
  })

  const addParticipant = useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      participantsApi.addParticipant(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', conversationId] })
    },
  })

  const removeParticipant = useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      participantsApi.removeParticipant(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', conversationId] })
    },
  })

  return {
    participants,
    addParticipant,
    removeParticipant,
  }
}

export function useUsers() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  })

  console.log('useUsers hook state:', {
    isLoading: users.isLoading,
    error: users.error,
    data: users.data,
    dataLength: users.data?.length
  })

  return {
    users,
  }
}
