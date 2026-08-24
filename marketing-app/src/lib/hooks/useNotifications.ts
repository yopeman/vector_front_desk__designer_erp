import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'
import { supabase } from '../supabase/client'
import { useEffect, useState } from 'react'

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()
  const [readNotifications, setReadNotifications] = useState<any[]>([])
  const [newNotification, setNewNotification] = useState<any>(null)

  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await notificationsApi.getAll()
      return data || []
    },
  })

  const unreadNotifications = useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: async () => {
      if (!userId) return []
      return notificationsApi.getUnread(userId)
    },
    enabled: !!userId,
  })

  const isRead = (notifId: string) => {
    return readNotifications.some(
      (rn) => rn.notification_id === notifId && rn.is_read
    )
  }

  useEffect(() => {
    if (!userId) return

    const fetchReadNotifications = async () => {
      try {
        const { data } = await supabase
          .from('read_notifications')
          .select('*')
          .eq('user_id', userId)
        
        setReadNotifications(data || [])
      } catch (error) {
        console.error('Error fetching read notifications:', error)
      }
    }

    fetchReadNotifications()
  }, [userId])

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-channel-${Date.now()}-${Math.random()*1_000_000_000}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
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
  }, [queryClient])

  const markAsRead = useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) => {
      if (!userId) return Promise.resolve()
      return notificationsApi.markAsRead(userId, notificationId)
    },
    onSuccess: (_, { notificationId }) => {
      setReadNotifications(prev => [
        ...prev,
        { notification_id: notificationId, user_id: userId, is_read: true }
      ])
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return
      await notificationsApi.markAllAsRead(userId)
    },
    onSuccess: async () => {
      try {
        const { data } = await supabase
          .from('read_notifications')
          .select('*')
          .eq('user_id', userId)
        setReadNotifications(data || [])
      } catch (error) {
        console.error('Error fetching read notifications:', error)
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] })
    },
  })

  const deleteNotification = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] })
    },
  })

  const deleteAll = useMutation({
    mutationFn: async () => {
      if (!userId) return
      await notificationsApi.deleteAll(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] })
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
    isRead,
    readNotifications,
  }
}
