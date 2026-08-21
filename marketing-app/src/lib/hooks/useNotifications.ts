import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

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
  }
}
