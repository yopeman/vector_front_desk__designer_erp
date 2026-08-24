import { supabase } from '../supabase/client'
import { Message } from '../../types/database'

type MessageInsert = Omit<Message, 'id' | 'created_at' | 'sent_at'>
type MessageUpdate = Partial<MessageInsert>

export const messagesApi = {
  async getByUsers(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Message[]
  },

  async create(message: MessageInsert) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        text: message.text,
        is_read: message.is_read,
        attached_file_ids: message.attached_file_ids,
      })
      .select()
      .single()
    
    if (error) throw error
    return data as Message
  },

  async update(id: string, message: MessageUpdate) {
    const { data, error } = await supabase
      .from('messages')
      .update(message)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Message
  },

  async markAsRead(userId: string, otherUserId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .neq('sender_id', userId)
    
    if (error) throw error
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async uploadFile(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `messages/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    return filePath
  },

  async getFileUrl(filePath: string) {
    const { data, error } = await supabase.storage
      .from('messages')
      .createSignedUrl(filePath, 3600)

    if (error) throw error
    return data.signedUrl
  },

  async deleteFile(filePath: string) {
    const { error } = await supabase.storage
      .from('messages')
      .remove([filePath])

    if (error) throw error
  },
}

export const usersApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, role')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users from users:', error)
      throw error
    }
    return data as Array<{ id: string; email: string; username?: string; role?: string }>
  },
}
