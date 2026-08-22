import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi, usersApi } from '../api/messages'
import { Message, User } from '../../types/database'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

export function useMessages(otherUserId: string | undefined) {
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' })

  const messages = useQuery({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id || !otherUserId) return []
      setCurrentUser({ id: user.id, email: user.email || '', full_name: user.user_metadata?.full_name, role: user.user_metadata?.role })
      return messagesApi.getByUsers(user.id, otherUserId)
    },
    enabled: !!otherUserId,
  })

  const createMessage = useMutation({
    mutationFn: messagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] })
    },
  })

  const markAsRead = useMutation({
    mutationFn: () => {
      if (!currentUser?.id || !otherUserId) return Promise.resolve()
      return messagesApi.markAsRead(currentUser.id, otherUserId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] })
    },
  })

  const deleteMessage = useMutation({
    mutationFn: messagesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] })
    },
  })

  useEffect(() => {
    if (!otherUserId || !currentUser?.id) return

    let channel: any

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      channel = supabase
        .channel(`messages-channel-${otherUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId}))`,
          },
          async (payload: any) => {
            queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] })
            
            if (payload.new.sender_id !== currentUserId) {
              setNotification({
                show: true,
                title: 'New Message',
                message: 'You have a new message'
              })
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [otherUserId, currentUser?.id, queryClient])

  return {
    messages,
    createMessage,
    markAsRead,
    deleteMessage,
    notification,
    setNotification,
    currentUser,
  }
}

export function useUsers() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  })

  return {
    users,
  }
}
