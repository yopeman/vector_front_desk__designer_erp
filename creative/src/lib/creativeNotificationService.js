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
  try {
    const notificationData = {
      title,
      body: message,
      icon: 'fa-bell',
      color: '#3b82f6'
    };
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Get notifications for a user
export async function getCreativeNotifications(userId, limit = 20) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    // Get all notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (notifError) throw notifError;

    // Get read notifications for current user
    const { data: readNotifications, error: readError } = await supabase
      .from('read_notifications')
      .select('*')
      .eq('user_id', currentUserId);

    if (readError) throw readError;

    // Mark notifications as read based on read_notifications table
    const readNotifIds = new Set(readNotifications?.map(rn => rn.notification_id) || []);
    const notificationsWithReadStatus = (notifications || []).map(notif => ({
      ...notif,
      is_read: readNotifIds.has(notif.id),
      message: notif.body
    }));

    return notificationsWithReadStatus;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id');

    if (error) throw error;

    const { data: readNotifications } = await supabase
      .from('read_notifications')
      .select('notification_id')
      .eq('user_id', currentUserId);

    const readNotifIds = new Set(readNotifications?.map(rn => rn.notification_id) || []);
    const unreadCount = (notifications || []).filter(n => !readNotifIds.has(n.id)).length;

    return unreadCount;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: existing } = await supabase
      .from('read_notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('notification_id', notificationId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('read_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('read_notifications')
        .insert({
          user_id: currentUserId,
          notification_id: notificationId,
          is_read: true,
          read_at: new Date().toISOString()
        });
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: notifications } = await supabase
      .from('notifications')
      .select('id');

    const { data: readNotifications } = await supabase
      .from('read_notifications')
      .select('notification_id')
      .eq('user_id', currentUserId);

    const readNotifIds = new Set(readNotifications?.map(rn => rn.notification_id) || []);
    const unreadNotifs = (notifications || []).filter(n => !readNotifIds.has(n.id));

    for (const notif of unreadNotifs) {
      await markNotificationAsRead(notif.id);
    }

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
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Notify all creative admins - simplified version without admin table
export async function notifyAllCreativeAdmins({
  title,
  message,
  type = 'info',
  category = 'general',
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null
}) {
  try {
    // Create a single notification visible to all
    const notificationData = {
      title,
      body: message,
      icon: 'fa-bell',
      color: '#3b82f6'
    };
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;
    return [data];
  } catch (error) {
    console.error('Error notifying admins:', error);
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
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
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