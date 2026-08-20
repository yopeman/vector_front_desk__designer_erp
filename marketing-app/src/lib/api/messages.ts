import { supabase } from '../supabase/client'
import { Message, Conversation, ConversationParticipant } from '../../types/database'

type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
type ConversationUpdate = Partial<ConversationInsert>

type MessageInsert = Omit<Message, 'id' | 'created_at'>
type MessageUpdate = Partial<MessageInsert>

type ParticipantInsert = Omit<ConversationParticipant, 'id' | 'joined_at'>

export const conversationsApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations (
          id,
          name,
          is_group_chat,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('conversations(updated_at)', { ascending: false })
    
    if (error) throw error
    return data.map((item: any) => item.conversations) as Conversation[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Conversation
  },

  async create(conversation: ConversationInsert, participantIds: string[]) {
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single()
    
    if (error) throw error
    
    const newConversation = data as Conversation
    
    // Add participants
    const participants = participantIds.map(userId => ({
      conversation_id: newConversation.id,
      user_id: userId
    }))
    
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(participants)
    
    if (participantError) throw participantError
    
    return newConversation
  },

  async update(id: string, conversation: ConversationUpdate) {
    const { data, error } = await supabase
      .from('conversations')
      .update(conversation)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Conversation
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}

export const messagesApi = {
  async getByConversation(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Message[]
  },

  async create(message: MessageInsert) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
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

  async markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
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
}

export const participantsApi = {
  async getByConversation(conversationId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        conversations!inner (
          id
        )
      `)
      .eq('conversation_id', conversationId)
    
    if (error) throw error
    return data as ConversationParticipant[]
  },

  async addParticipant(conversationId: string, userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    return data as ConversationParticipant
  },

  async removeParticipant(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
    
    if (error) throw error
  },
}

export const usersApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users from profiles:', error)
      throw error
    }
    console.log('Fetched users from profiles:', data)
    return data as Array<{ id: string; email: string }>
  },
}
