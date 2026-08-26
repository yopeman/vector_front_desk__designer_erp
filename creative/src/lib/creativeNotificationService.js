import { supabase } from './supabaseClient';

/**
 * Creative Portal Notification Service
 * Handles creation and management of notifications for creative portal
 */

// Create a single notification
export async function createCreativeNotification({
  userId,
  title,
  message,
  type = 'info',
  category = 'general',
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null
}) {
  console.log('🔔 [NOTIFICATION DEBUG] Creating single notification');
  console.log('🔔 [NOTIFICATION DEBUG] User ID:', userId);
  console.log('🔔 [NOTIFICATION DEBUG] Title:', title);
  
  try {
    const notificationData = {
      user_id: userId,
      title,
      message,
      type,
      category,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      action_url: actionUrl,
      is_read: false
    };
    
    console.log('🔔 [NOTIFICATION DEBUG] Notification data:', notificationData);
    
    const { data, error } = await supabase
      .from('creative_notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('🔔 [NOTIFICATION ERROR] Create failed:', error);
      throw error;
    }
    
    console.log('🔔 [NOTIFICATION SUCCESS] Notification created:', data);
    return data;
  } catch (error) {
    console.error('🔔 [NOTIFICATION CRITICAL ERROR] createCreativeNotification failed:', error);
    throw error;
  }
}

// Get notifications for a user
export async function getCreativeNotifications(userId, limit = 20) {
  console.log('🔔 [NOTIFICATION DEBUG] Fetching notifications for user:', userId);
  
  try {
    // Try to get notifications by user ID first
    const { data, error } = await supabase
      .from('creative_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('🔔 [NOTIFICATION ERROR] Error fetching by ID:', error);
      // Fallback: try to get by email if user ID doesn't work
      console.log('🔔 [NOTIFICATION DEBUG] Trying email fallback...');
      const { data: emailData, error: emailError } = await supabase
        .from('creative_notifications')
        .select('*')
        .eq('user_id', userId) // In case userId is actually an email
        .order('created_at', { ascending: false })
        .limit(limit);

      if (emailError) {
        console.error('🔔 [NOTIFICATION ERROR] Email fallback also failed:', emailError);
        throw emailError;
      }
      
      console.log('🔔 [NOTIFICATION SUCCESS] Fetched notifications via email fallback:', emailData);
      return emailData;
    }

    console.log('🔔 [NOTIFICATION SUCCESS] Fetched notifications:', data);
    return data;
  } catch (error) {
    console.error('🔔 [NOTIFICATION CRITICAL ERROR] getCreativeNotifications failed:', error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId) {
  try {
    const { count, error } = await supabase
      .from('creative_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('creative_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await supabase
      .from('creative_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteCreativeNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('creative_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Notify all creative admins
export async function notifyAllCreativeAdmins({
  title,
  message,
  type = 'info',
  category = 'general',
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null
}) {
  console.log('🔔 [NOTIFICATION DEBUG] Starting notifyAllCreativeAdmins');
  console.log('🔔 [NOTIFICATION DEBUG] Title:', title);
  console.log('🔔 [NOTIFICATION DEBUG] Message:', message);
  
  try {
    // Get all active creative admins
    console.log('🔔 [NOTIFICATION DEBUG] Fetching creative admins...');
    const { data: admins, error: adminError } = await supabase
      .from('creative_admins')
      .select('email')
      .eq('is_active', true);

    if (adminError) {
      console.error('🔔 [NOTIFICATION ERROR] Error fetching admins:', adminError);
      throw adminError;
    }
    
    console.log('🔔 [NOTIFICATION DEBUG] Found admins:', admins);
    console.log('🔔 [NOTIFICATION DEBUG] Admin count:', admins?.length || 0);

    if (!admins || admins.length === 0) {
      console.warn('🔔 [NOTIFICATION WARNING] No active creative admins found');
      return [];
    }

    // Get user IDs for these admins
    console.log('🔔 [NOTIFICATION DEBUG] Fetching user IDs for admins...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', admins.map(a => a.email));

    if (userError) {
      console.error('🔔 [NOTIFICATION ERROR] Error fetching user IDs:', userError);
      console.log('🔔 [NOTIFICATION DEBUG] Using email fallback method');
      
      // Fallback: create notifications using admin emails as user IDs
      const fallbackNotifications = admins.map(admin => ({
        user_id: admin.email, // Use email as fallback ID
        title,
        message,
        type,
        category,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        action_url,
        is_read: false
      }));

      console.log('🔔 [NOTIFICATION DEBUG] Inserting fallback notifications:', fallbackNotifications);
      
      const { data, error: fallbackError } = await supabase
        .from('creative_notifications')
        .insert(fallbackNotifications)
        .select();

      if (fallbackError) {
        console.error('🔔 [NOTIFICATION ERROR] Fallback insert failed:', fallbackError);
        throw fallbackError;
      }
      
      console.log('🔔 [NOTIFICATION SUCCESS] Fallback notifications created:', data);
      return data;
    }

    console.log('🔔 [NOTIFICATION DEBUG] Found users:', users);
    console.log('🔔 [NOTIFICATION DEBUG] User count:', users?.length || 0);

    // Create notifications for all admin users
    const notifications = users.map(user => ({
      user_id: user.id,
      title,
      message,
      type,
      category,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      action_url,
      is_read: false
    }));

    console.log('🔔 [NOTIFICATION DEBUG] Inserting notifications:', notifications);
    
    const { data, error } = await supabase
      .from('creative_notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('🔔 [NOTIFICATION ERROR] Insert failed:', error);
      throw error;
    }
    
    console.log('🔔 [NOTIFICATION SUCCESS] Notifications created:', data);
    return data;
  } catch (error) {
    console.error('🔔 [NOTIFICATION CRITICAL ERROR] notifyAllCreativeAdmins failed:', error);
    throw error;
  }
}

// Notify about prototype request status
export async function notifyPrototypeStatus(userId, prototypeId, status, prototypeTitle) {
  const title = `Prototype ${status}`;
  const message = `Your prototype request "${prototypeTitle}" has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'prototype',
    relatedEntityType: 'prototype',
    relatedEntityId: prototypeId,
    actionUrl: '/prototype'
  });
}

// Notify creative admin about new prototype
export async function notifyAdminNewPrototype(prototypeId, prototypeTitle, submitterName) {
  return notifyAllCreativeAdmins({
    title: 'New Prototype Request',
    message: `${submitterName} submitted a new prototype: "${prototypeTitle}"`,
    type: 'info',
    category: 'prototype',
    relatedEntityType: 'prototype',
    relatedEntityId: prototypeId,
    actionUrl: '/prototype'
  });
}

// Notify about idea status
export async function notifyIdeaStatus(userId, ideaId, status, ideaTitle) {
  const title = `Idea ${status}`;
  const message = `Your idea "${ideaTitle}" has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'idea',
    relatedEntityType: 'idea',
    relatedEntityId: ideaId,
    actionUrl: '/idea'
  });
}

// Notify creative admin about new idea
export async function notifyAdminNewIdea(ideaId, ideaTitle, submitterName) {
  return notifyAllCreativeAdmins({
    title: 'New Idea Submitted',
    message: `${submitterName} shared a new idea: "${ideaTitle}"`,
    type: 'info',
    category: 'idea',
    relatedEntityType: 'idea',
    relatedEntityId: ideaId,
    actionUrl: '/idea'
  });
}

// Notify about design BOM status
export async function notifyDesignStatus(userId, designId, status, designTitle) {
  const title = `Design ${status}`;
  const message = `Your design BOM "${designTitle}" has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'design',
    relatedEntityType: 'design',
    relatedEntityId: designId,
    actionUrl: '/design'
  });
}

// Notify creative admin about new design
export async function notifyAdminNewDesign(designId, designTitle, submitterName) {
  return notifyAllCreativeAdmins({
    title: 'New Design BOM Submitted',
    message: `${submitterName} submitted a new design BOM: "${designTitle}"`,
    type: 'info',
    category: 'design',
    relatedEntityType: 'design',
    relatedEntityId: designId,
    actionUrl: '/design'
  });
}

// Notify about leave request status
export async function notifyLeaveStatus(userId, leaveId, status, leaveType) {
  const title = `Leave Request ${status}`;
  const message = `Your ${leaveType} leave request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'leave',
    relatedEntityType: 'leave',
    relatedEntityId: leaveId,
    actionUrl: '/leave'
  });
}

// Notify creative admin about new leave request
export async function notifyAdminNewLeave(leaveId, leaveType, submitterName) {
  return notifyAllCreativeAdmins({
    title: 'New Leave Request',
    message: `${submitterName} requested ${leaveType} leave`,
    type: 'info',
    category: 'leave',
    relatedEntityType: 'leave',
    relatedEntityId: leaveId,
    actionUrl: '/leave'
  });
}

// Notify about resignation request
export async function notifyResignationStatus(userId, resignationId, status) {
  const title = `Resignation ${status}`;
  const message = `Your resignation request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'resignation',
    relatedEntityType: 'resignation',
    relatedEntityId: resignationId,
    actionUrl: '/resignation'
  });
}

// Notify creative admin about new resignation
export async function notifyAdminNewResignation(resignationId, submitterName) {
  return notifyAllCreativeAdmins({
    title: 'New Resignation Request',
    message: `${submitterName} submitted a resignation request`,
    type: 'warning',
    category: 'resignation',
    relatedEntityType: 'resignation',
    relatedEntityId: resignationId,
    actionUrl: '/resignation'
  });
}

// Notify about experience request
export async function notifyExperienceStatus(userId, experienceId, status) {
  const title = `Experience Request ${status}`;
  const message = `Your experience request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'experience',
    relatedEntityType: 'experience',
    relatedEntityId: experienceId,
    actionUrl: '/experience'
  });
}

// Notify about transfer request
export async function notifyTransferStatus(userId, transferId, status) {
  const title = `Transfer Request ${status}`;
  const message = `Your transfer request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'transfer',
    relatedEntityType: 'transfer',
    relatedEntityId: transferId,
    actionUrl: '/transfer'
  });
}

// Notify about promotion request
export async function notifyPromotionStatus(userId, promotionId, status) {
  const title = `Promotion Request ${status}`;
  const message = `Your promotion request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'promotion',
    relatedEntityType: 'promotion',
    relatedEntityId: promotionId,
    actionUrl: '/promotion'
  });
}

// Notify about hire request
export async function notifyHireStatus(userId, hireId, status) {
  const title = `Hire Request ${status}`;
  const message = `Your hire request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'hire',
    relatedEntityType: 'hire',
    relatedEntityId: hireId,
    actionUrl: '/hire'
  });
}

// Notify about budget request
export async function notifyBudgetStatus(userId, budgetId, status) {
  const title = `Budget Request ${status}`;
  const message = `Your budget request has been ${status.toLowerCase()}`;
  
  return createCreativeNotification({
    userId,
    title,
    message,
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    category: 'budget',
    relatedEntityType: 'budget',
    relatedEntityId: budgetId,
    actionUrl: '/budget'
  });
}

// Subscribe to notifications for a user
export function subscribeToCreativeNotifications(userId, callback) {
  return supabase
    .channel(`creative_notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'creative_notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

// Unsubscribe from notifications
export function unsubscribeFromNotifications(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}