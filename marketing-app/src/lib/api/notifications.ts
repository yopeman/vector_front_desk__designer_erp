import { supabase } from '../supabase/client'

type NotificationInsert = Omit<any, 'id' | 'created_at'>
type NotificationUpdate = Partial<NotificationInsert>

export const notificationsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getUnread(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (!data) return []
    
    const { data: readData, error: readError } = await supabase
      .from('read_notifications')
      .select('notification_id, is_read')
      .eq('user_id', userId)
    
    if (readError) throw readError
    
    const readNotificationIds = new Set(
      (readData || [])
        .filter(rn => rn.is_read)
        .map(rn => rn.notification_id)
    )
    
    return data.filter(n => !readNotificationIds.has(n.id))
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, notification: NotificationUpdate) {
    const { data, error } = await supabase
      .from('notifications')
      .update(notification)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAsRead(userId: string, notificationId: string) {
    const existing = await supabase
      .from('read_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_id', notificationId)
      .maybeSingle()
    
    if (existing.data) {
      const { error } = await supabase
        .from('read_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', existing.data.id)
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('read_notifications')
        .insert({
          user_id: userId,
          notification_id: notificationId,
          is_read: true,
          read_at: new Date().toISOString(),
        })
      
      if (error) throw error
    }
  },

  async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
    
    if (error) throw error
    
    const notifications = data || []
    
    await Promise.all(
      notifications.map(async (notif) => {
        const existing = await supabase
          .from('read_notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_id', notif.id)
          .maybeSingle()
        
        if (existing.data) {
          await supabase
            .from('read_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', existing.data.id)
        } else {
          await supabase
            .from('read_notifications')
            .insert({
              user_id: userId,
              notification_id: notif.id,
              is_read: true,
              read_at: new Date().toISOString(),
            })
        }
      })
    )
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async deleteAll(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
    
    if (error) throw error
    
    const notifications = data || []
    
    await Promise.all(
      notifications.map(notif =>
        supabase
          .from('read_notifications')
          .delete()
          .eq('user_id', userId)
          .eq('notification_id', notif.id)
      )
    )
  },
}
