import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'
import { supabase } from '../supabase/client'
import { useEffect, useState } from 'react'

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()
  const [newNotification, setNewNotification] = useState<any>(null)

  const notifications = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsApi.getAll(userId!),
    enabled: !!userId,
  })

  const unreadNotifications = useQuery({
    queryKey: ['notifications', userId, 'unread'],
    queryFn: () => notificationsApi.getUnread(userId!),
    enabled: !!userId,
  })

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userId) return

    const channelName = `notifications-${userId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          setNewNotification({
            show: true,
            title: payload.new.title,
            message: payload.new.message || payload.new.body
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications channel')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to notifications channel')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  const markAsRead = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteNotification = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteAll = useMutation({
    mutationFn: () => notificationsApi.deleteAll(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications,
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    newNotification,
    setNewNotification,
  }
}
