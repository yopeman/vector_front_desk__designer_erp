import { supabase } from './supabaseClient';

/**
 * Creative Portal Message Service
 * Handles real-time messaging between creative portal users
 */

// Send a message
export async function sendCreativeMessage(senderId, receiverId, message) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        text: message,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get user ID from email
export async function getUserIdFromEmail(email) {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!userError && userData) {
      return userData.id;
    }

    console.error('User not found for email:', email);
    return null;
  } catch (error) {
    console.error('Error getting user ID from email:', error);
    return null;
  }
}

// Get conversation between two users
export async function getCreativeConversation(user1Id, user2Id) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(username, email), receiver:users!messages_receiver_id_fkey(username, email)')
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { success: false, error: error.message };
  }
}

// Get all conversations for a user
export async function getCreativeUserConversations(userId) {
  try {
    // Get all users from the users table
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, email');

    if (userError) throw userError;

    // Filter out current user
    const otherUsers = (users || []).filter(u => u.id !== userId);

    // For each user, get the last message and unread count
    const conversations = [];
    for (const user of otherUsers) {
      const { data: messages } = await supabase
        .from('messages')
        .select('text, sent_at')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${userId})`)
        .order('sent_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (messages && messages.length > 0) {
        conversations.push({
          other_user_id: user.id,
          other_user_name: user.username || user.email.split('@')[0],
          other_user_email: user.email,
          last_message: messages[0].text,
          last_message_time: messages[0].sent_at,
          unread_count: count || 0
        });
      }
    }

    return { success: true, data: conversations };
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return { success: false, error: error.message };
  }
}

// Mark messages as read
export async function markCreativeMessagesAsRead(senderId, receiverId) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
}

// Delete a specific message
export async function deleteCreativeMessage(messageId) {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: error.message };
  }
}

// Delete all messages in a conversation
export async function deleteCreativeConversation(user1Id, user2Id) {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: error.message };
  }
}

// Subscribe to new messages in a conversation
export function subscribeToCreativeConversation(user1Id, user2Id, callback) {
  return supabase
    .channel(`chat:${user1Id}:${user2Id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id}))`
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

// Subscribe to all conversations for a user
export function subscribeToCreativeUserConversations(userId, callback) {
  return supabase
    .channel(`user_conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`
      },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

// Unsubscribe from a channel
export function unsubscribeFromCreativeChannel(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

// Get creative users available for messaging
export async function getCreativeUsers(currentUserId) {
  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, email');

    if (userError) {
      console.error('Error fetching users:', userError);
      return { success: false, error: userError.message };
    }

    const availableUsers = (users || [])
      .filter(u => u.id !== currentUserId)
      .map(u => ({
        id: u.id,
        username: u.username || u.email.split('@')[0],
        email: u.email
      }));

    return { success: true, data: availableUsers };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: error.message };
  }
}