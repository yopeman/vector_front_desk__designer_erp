import { supabase } from './supabaseClient';

/**
 * Creative Portal Message Service
 * Handles real-time messaging between creative portal users
 */

// Send a message
export async function sendCreativeMessage(senderId, receiverId, message) {
  try {
    console.log('Sending creative message:', { senderId, receiverId, message });
    const { data, error } = await supabase
      .from('creative_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Creative message sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending creative message:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get user ID from email
export async function getUserIdFromEmail(email) {
  try {
    // Try to get from users table first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!userError && userData) {
      return userData.id;
    }

    // If not found in users table, try creative_admins to get the email, then users
    const { data: adminData, error: adminError } = await supabase
      .from('creative_admins')
      .select('email')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (!adminError && adminData) {
      // Admin exists, try to get their UUID from users table
      const { data: adminUserData, error: adminUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!adminUserError && adminUserData) {
        return adminUserData.id;
      }
    }

    // If not found anywhere, return null to indicate failure
    console.error('User not found for email:', email);
    return null;
  } catch (error) {
    console.error('Error getting user ID from email:', error);
    return null; // Return null on error instead of email
  }
}

// Get conversation between two users
export async function getCreativeConversation(user1Id, user2Id) {
  try {
    const { data, error } = await supabase
      .from('creative_messages')
      .select('*')
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting creative conversation:', error);
    return { success: false, error: error.message };
  }
}

// Get all conversations for a user
export async function getCreativeUserConversations(userId) {
  try {
    // Get all messages involving this user
    const { data: messages, error: messagesError } = await supabase
      .from('creative_messages')
      .select('sender_id, receiver_id, message, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    // Get unique conversation partners
    const partnerIds = new Set();
    messages.forEach(msg => {
      if (msg.sender_id !== userId) partnerIds.add(msg.sender_id);
      if (msg.receiver_id !== userId) partnerIds.add(msg.receiver_id);
    });

    // Get creative admins to resolve names
    const { data: admins, error: adminError } = await supabase
      .from('creative_admins')
      .select('email')
      .eq('is_active', true);

    if (adminError) throw adminError;

    // Create email to name mapping
    const emailToName = {};
    admins.forEach(admin => {
      emailToName[admin.email] = admin.email.split('@')[0]; // Use email prefix as name
    });

    // Fetch user details for each partner
    const conversations = [];
    for (const partnerId of partnerIds) {
      const partnerMessages = messages.filter(msg => 
        (msg.sender_id === userId && msg.receiver_id === partnerId) ||
        (msg.sender_id === partnerId && msg.receiver_id === userId)
      );

      const lastMessage = partnerMessages[0];
      const unreadCount = messages.filter(msg => 
        msg.sender_id === partnerId && msg.receiver_id === userId && !msg.is_read
      ).length;

      // Try to resolve user name and email
      let userName = 'Unknown User';
      let userEmail = partnerId;
      let actualPartnerId = partnerId;
      let skipConversation = false;

      // Check if partnerId is an email (legacy data)
      if (partnerId.includes('@')) {
        userEmail = partnerId;
        userName = emailToName[partnerId] || partnerId.split('@')[0];
        // Try to resolve the actual UUID from the email
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', partnerId)
            .single();
          
          if (userData) {
            actualPartnerId = userData.id;
          } else {
            // User doesn't exist in users table, skip this conversation
            console.warn('Skipping conversation with user that has no UUID record:', partnerId);
            skipConversation = true;
          }
        } catch (error) {
          console.error('Error resolving UUID from email:', error);
          // User doesn't exist in users table, skip this conversation
          skipConversation = true;
        }
      } else {
        // partnerId is already a UUID, get the email
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', partnerId)
            .single();
          
          if (userData) {
            userEmail = userData.email;
            userName = emailToName[userData.email] || userData.email.split('@')[0];
          } else {
            // UUID doesn't exist in users table, skip this conversation
            console.warn('Skipping conversation with non-existent user:', partnerId);
            skipConversation = true;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          skipConversation = true;
        }
      }

      if (!skipConversation) {
        conversations.push({
          other_user_id: actualPartnerId,
          other_user_name: userName,
          other_user_email: userEmail,
          last_message: lastMessage.message,
          last_message_time: lastMessage.created_at,
          unread_count: unreadCount
        });
      }
    }

    return { success: true, data: conversations };
  } catch (error) {
    console.error('Error getting creative user conversations:', error);
    return { success: false, error: error.message };
  }
}

// Mark messages as read
export async function markCreativeMessagesAsRead(senderId, receiverId) {
  try {
    const { error } = await supabase
      .from('creative_messages')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking creative messages as read:', error);
    return { success: false, error: error.message };
  }
}

// Delete a specific message
export async function deleteCreativeMessage(messageId) {
  try {
    const { error } = await supabase
      .from('creative_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting creative message:', error);
    return { success: false, error: error.message };
  }
}

// Delete all messages in a conversation
export async function deleteCreativeConversation(user1Id, user2Id) {
  try {
    const { error } = await supabase
      .from('creative_messages')
      .delete()
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting creative conversation:', error);
    return { success: false, error: error.message };
  }
}

// Subscribe to new messages in a conversation
export function subscribeToCreativeConversation(user1Id, user2Id, callback) {
  return supabase
    .channel(`creative_chat:${user1Id}:${user2Id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'creative_messages',
        filter: `sender_id=eq.${user1Id}&receiver_id=eq.${user2Id}`
      },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'creative_messages',
        filter: `sender_id=eq.${user2Id}&receiver_id=eq.${user1Id}`
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

// Subscribe to all conversations for a user
export function subscribeToCreativeUserConversations(userId, callback) {
  return supabase
    .channel(`creative_user_conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'creative_messages',
        filter: `sender_id=eq.${userId}`
      },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'creative_messages',
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
    // Get all users from the users table (these have proper UUIDs)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email');

    if (userError) {
      console.error('Error fetching users:', userError);
      return { success: false, error: userError.message };
    }

    // Filter out current user and format user data
    const availableUsers = users
      .filter(u => u.id !== currentUserId)
      .map(u => ({
        id: u.id,
        email: u.email,
        user_metadata: { full_name: u.email.split('@')[0] }
      }));

    return { success: true, data: availableUsers };
  } catch (error) {
    console.error('Error getting creative users:', error);
    return { success: false, error: error.message };
  }
}