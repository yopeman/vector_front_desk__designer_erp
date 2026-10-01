import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  getLastNotificationResponse,
  onNotificationReceived,
  onNotificationResponse,
  registerForPushNotifications,
} from '@/lib/notifications';

/**
 * Registers the device for push and routes the user when a notification is tapped.
 * `data.url` in the FCM payload drives the destination (expo-router deep links).
 */
export function usePushNotifications() {
  useEffect(() => {
    registerForPushNotifications().catch((error) => {
      console.warn('Push notification registration failed:', error);
    });

    const received = onNotificationReceived((notification) => {
      console.log('[push] received', notification.request.content);
    });

    let handledInitial = false;

    const handleResponse = (notificationUrl: unknown) => {
      if (typeof notificationUrl !== 'string') {
        return;
      }
      router.push(notificationUrl as never);
    };

    const response = onNotificationResponse(({ notification }) => {
      handleResponse(notification.request.content.data?.url);
    });

    getLastNotificationResponse().then((last) => {
      if (handledInitial || !last?.notification) {
        return;
      }
      handledInitial = true;
      handleResponse(last.notification.request.content.data?.url);
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, []);
}