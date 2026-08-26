# Creative Portal Notification & Messaging System Setup Guide

## Overview
This guide will help you set up the comprehensive notification and real-time messaging system for the creative portal.

## What Was Implemented

### 1. Notification System
- **Database Tables**: `creative_notifications` table with full RLS policies
- **Service Layer**: `creativeNotificationService.js` with notification functions
- **UI Components**: `Notifications.jsx` - A beautiful notification bell with dropdown
- **Integration**: Notifications integrated across all sections (Prototype, Idea, Design, Leave)

### 2. Real-Time Messaging System
- **Database Tables**: `creative_messages` table with full RLS policies
- **Service Layer**: `creativeMessageService.js` with messaging functions
- **UI Components**: `CreativeChat.jsx` - Full-featured chat interface
- **Features**: 
  - Real-time messaging using Supabase subscriptions
  - Conversation management
  - Read/unread status tracking
  - Message deletion
  - User search for new conversations

## Database Setup

### Step 1: Run the Migration SQL
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and run the contents of `setup-creative-notifications-messages.sql`
4. This will create all necessary tables, indexes, functions, and RLS policies

### Step 2: Verify Tables
After running the migration, verify that these tables exist:
- `creative_notifications`
- `creative_messages`

## Features Implemented

### Notification Features
- ✅ Automatic notifications when users submit prototypes, ideas, designs, or leave requests
- ✅ Status change notifications (approved/rejected) for all submissions
- ✅ Real-time notification updates using Supabase subscriptions
- ✅ Notification bell with unread count badge
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Delete notifications
- ✅ Categorized notifications (prototype, idea, design, leave, etc.)
- ✅ Different notification types (info, success, warning, error)

### Messaging Features
- ✅ Real-time messaging between creative portal users
- ✅ Conversation list with last message preview
- ✅ Unread message count per conversation
- ✅ Real-time message updates using Supabase subscriptions
- ✅ User search for starting new conversations
- ✅ Message input with send functionality
- ✅ Delete individual messages
- ✅ Delete entire conversations
- ✅ Mobile-responsive design
- ✅ Timestamp formatting (just now, 5m ago, 2h ago, etc.)

## Integration Points

### Modified Files
1. **Header.jsx** - Added Notifications component
2. **App.jsx** - Replaced MessagesTab with CreativeChat
3. **PrototypeTab.jsx** - Added notification integration
4. **IdeaTab.jsx** - Added notification integration
5. **DesignTab.jsx** - Added notification integration
6. **LeaveTab.jsx** - Added notification integration

### New Files Created
1. **creativeNotificationService.js** - Notification service layer
2. **creativeMessageService.js** - Messaging service layer
3. **Notifications.jsx** - Notification UI component
4. **CreativeChat.jsx** - Messaging UI component
5. **setup-creative-notifications-messages.sql** - Database migration

## Testing the System

### 1. Test Notifications
1. Log in as a regular user
2. Submit a prototype, idea, design, or leave request
3. Log in as a creative admin
4. Check the notification bell - you should see a notification about the new submission
5. Approve/reject the submission
6. Log back in as the regular user
7. Check notifications - you should see the status update notification

### 2. Test Messaging
1. Log in as a creative admin
2. Navigate to the Messages tab
3. Click "New Message"
4. Search for and select another user
5. Send a message
6. Log in as the other user
7. Navigate to Messages - you should see the new message
8. Reply to the message
9. Check that real-time updates work

## Troubleshooting

### Notifications Not Showing
- Ensure the database migration was run successfully
- Check that the `creative_notifications` table exists
- Verify RLS policies are correctly set
- Check browser console for errors

### Messages Not Sending
- Ensure the `creative_messages` table exists
- Verify that both users have valid user accounts in the auth system
- Check that users are in the `creative_admins` table if needed
- Verify Supabase real-time subscriptions are working

### Permission Errors
- Ensure RLS policies are correctly configured
- Check that the authenticated role has proper permissions
- Verify that user IDs are correctly linked to employee records

## User Roles

### Creative Admins
- Receive notifications when users submit requests
- Can approve/reject submissions (triggers notifications to users)
- Can message all creative portal users

### Regular Users
- Submit requests (triggers notifications to admins)
- Receive notifications when their requests are approved/rejected
- Can message creative admins and other users

## Configuration

### Environment Variables
Ensure your `.env` file has the correct Supabase configuration:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Creative Admins
Ensure creative admins are properly set up in the `creative_admins` table:
```sql
INSERT INTO creative_admins (email, is_active) 
VALUES ('admin@example.com', true);
```

## Next Steps

1. **Run the database migration** using the provided SQL file
2. **Test the notification system** by submitting and approving requests
3. **Test the messaging system** by sending messages between users
4. **Customize notification templates** if needed in the service files
5. **Add additional notification categories** if you have more sections

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify the Supabase database tables and RLS policies
3. Ensure all environment variables are correctly set
4. Check that users are properly authenticated

## Performance Considerations

- The system uses Supabase real-time subscriptions for instant updates
- Database indexes are optimized for common queries
- RLS policies ensure data security while maintaining performance
- Consider implementing notification cleanup/archival for long-running systems