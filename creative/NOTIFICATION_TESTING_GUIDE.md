# Notification System Testing Guide

## 🔍 Step-by-Step Testing Instructions

### 1. **Database Setup Verification**
First, ensure your database tables exist and have the correct permissions:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('creative_notifications', 'creative_messages');

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('creative_notifications', 'creative_messages');

-- Should show: rowsecurity = false (RLS disabled)
```

### 2. **Run the RLS Fix**
If RLS is still enabled, run this in your Supabase SQL Editor:

```sql
-- File: creative/fix-rls-policies.sql
ALTER TABLE creative_messages DISABLE ROW LEVEL SECURITY IF EXISTS;
ALTER TABLE creative_notifications DISABLE ROW LEVEL SECURITY IF EXISTS;

DROP POLICY IF EXISTS "Users can read own messages" ON creative_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON creative_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON creative_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON creative_messages;

DROP POLICY IF EXISTS "Users can read own notifications" ON creative_notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON creative_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON creative_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON creative_notifications;

GRANT ALL ON creative_messages TO authenticated;
GRANT ALL ON creative_messages TO service_role;
GRANT ALL ON creative_notifications TO authenticated;
GRANT ALL ON creative_notifications TO service_role;
```

### 3. **Verify Creative Admins Setup**
Check that you have creative admins configured:

```sql
-- Check creative admins
SELECT * FROM creative_admins WHERE is_active = true;

-- If empty, add an admin:
INSERT INTO creative_admins (email, is_active) 
VALUES ('your-email@example.com', true);
```

### 4. **Browser Console Testing**
Open your browser's developer console (F12) and follow these steps:

#### Test 1: Submit a Prototype as Regular User
1. Log in as a regular user (HR user)
2. Open browser console
3. Navigate to Prototype tab
4. Submit a new prototype
5. **Watch console for these logs:**
   ```
   🔔 [NOTIFICATION DEBUG] Starting notifyAllCreativeAdmins
   🔔 [NOTIFICATION DEBUG] Title: New Prototype Request
   🔔 [NOTIFICATION DEBUG] Fetching creative admins...
   🔔 [NOTIFICATION DEBUG] Found admins: [...]
   🔔 [NOTIFICATION SUCCESS] Notifications created: [...]
   ```

#### Test 2: Check Database Directly
After submitting, run this in Supabase SQL Editor:

```sql
-- Check if notifications were created
SELECT * FROM creative_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- Check who received notifications
SELECT user_id, title, message, created_at 
FROM creative_notifications 
ORDER BY created_at DESC;
```

#### Test 3: Login as Admin and Check Notifications
1. Log out as regular user
2. Log in as creative admin
3. Open browser console
4. Click the notification bell
5. **Watch console for these logs:**
   ```
   🔔 [UI DEBUG] Loading notifications for user: [user-id] [email]
   🔔 [NOTIFICATION DEBUG] Fetching notifications for user: [user-id]
   🔔 [NOTIFICATION SUCCESS] Fetched notifications: [...]
   🔔 [UI DEBUG] Notifications loaded: [...]
   ```

### 5. **Manual Database Insert Test**
If the above doesn't work, test the notification system directly:

```sql
-- Test inserting a notification manually
INSERT INTO creative_notifications (
  user_id, 
  title, 
  message, 
  type, 
  category, 
  is_read
) VALUES (
  'test-user@example.com',  -- Use an email or user ID
  'Test Notification',
  'This is a test notification',
  'info',
  'general',
  false
);

-- Check if it was inserted
SELECT * FROM creative_notifications 
WHERE title = 'Test Notification';

-- If this works, the table is fine but the app integration has issues
```

### 6. **Check User ID Resolution**
The system might be having issues with user ID vs email resolution:

```sql
-- Check your users table
SELECT id, email FROM users LIMIT 10;

-- Check creative admins
SELECT email FROM creative_admins WHERE is_active = true;

-- They should match - if users table is empty, the system uses email fallback
```

## 🐛 Common Issues and Solutions

### Issue: "No notifications appear"
**Debug Steps:**
1. Check browser console for 🔔 logs
2. Check database: `SELECT * FROM creative_notifications ORDER BY created_at DESC LIMIT 10;`
3. If database has notifications but UI doesn't show them → UI issue
4. If database is empty → Notification creation issue

### Issue: "Notifications created but wrong user receives them"
**Debug Steps:**
1. Check `user_id` in database notifications
2. Compare with actual user IDs in users table
3. System might be using email instead of UUID

### Issue: "Console shows errors"
**Common Errors:**
- `relation "creative_notifications" does not exist` → Run migration
- `new row violates row-level security policy` → Run RLS fix
- `column "user_id" does not exist` → Table structure issue

## ✅ Success Criteria

The notification system is working when:

1. ✅ **User submits item** → Console shows "🔔 [NOTIFICATION SUCCESS]"
2. ✅ **Database has records** → `SELECT * FROM creative_notifications` shows new rows
3. ✅ **Admin sees notifications** → Notification bell shows count
4. ✅ **Admin can view notifications** → Clicking bell shows list
5. ✅ **Status changes work** → Approving/rejecting creates notifications

## 🔧 Advanced Debugging

### Enable Detailed Logging
The system now has comprehensive logging with 🔔 prefixes. Look for:

- `🔔 [NOTIFICATION DEBUG]` - Normal operation logs
- `🔔 [NOTIFICATION SUCCESS]` - Successful operations
- `🔔 [NOTIFICATION ERROR]` - Error conditions
- `🔔 [NOTIFICATION CRITICAL ERROR]` - Critical failures
- `🔔 [UI DEBUG]` - UI component logs
- `🔔 [UI ERROR]` - UI component errors

### Test Notification Service Directly
Create a test file to test the service directly:

```javascript
// test-notifications.js
import { notifyAllCreativeAdmins } from './src/lib/creativeNotificationService';

async function testNotification() {
  try {
    const result = await notifyAllCreativeAdmins({
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      category: 'general'
    });
    console.log('Test successful:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNotification();
```

## 📊 Expected Console Output

### Successful Notification Creation:
```
🔔 [NOTIFICATION DEBUG] Starting notifyAllCreativeAdmins
🔔 [NOTIFICATION DEBUG] Title: New Prototype Request
🔔 [NOTIFICATION DEBUG] Message: User submitted new prototype
🔔 [NOTIFICATION DEBUG] Fetching creative admins...
🔔 [NOTIFICATION DEBUG] Found admins: [{email: "admin@example.com"}]
🔔 [NOTIFICATION DEBUG] Admin count: 1
🔔 [NOTIFICATION DEBUG] Fetching user IDs for admins...
🔔 [NOTIFICATION DEBUG] Found users: [{id: "uuid", email: "admin@example.com"}]
🔔 [NOTIFICATION DEBUG] User count: 1
🔔 [NOTIFICATION DEBUG] Inserting notifications: [{user_id: "uuid", ...}]
🔔 [NOTIFICATION SUCCESS] Notifications created: [{id: "uuid", ...}]
```

### Successful Notification Loading:
```
🔔 [UI DEBUG] Loading notifications for user: uuid user@example.com
🔔 [NOTIFICATION DEBUG] Fetching notifications for user: uuid
🔔 [NOTIFICATION SUCCESS] Fetched notifications: [{...}]
🔔 [UI DEBUG] Notifications loaded: [{...}]
```

## 🚨 If Still Not Working

1. **Share the console logs** - Copy all 🔔 prefixed logs
2. **Check database directly** - Run `SELECT * FROM creative_notifications ORDER BY created_at DESC LIMIT 10;`
3. **Verify user setup** - Ensure users exist in users table
4. **Check admin setup** - Ensure creative_admins has active admins
5. **Verify RLS is disabled** - Run the RLS fix SQL again

The comprehensive logging will show exactly where the notification system is failing.