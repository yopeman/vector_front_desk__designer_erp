import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://10.0.2.2:4000';
const ANDROID_CHANNEL_ID = process.env.EXPO_PUBLIC_ANDROID_CHANNEL_ID ?? 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type RegisterDeviceInput = {
  token: string;
  platform: string;
  userId?: string | null;
};

export async function registerDevice(input: RegisterDeviceInput) {
  const response = await fetch(`${API_BASE_URL}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to register device: ${response.status}`);
  }

  return response.json();
}

export async function unregisterDevice(token: string) {
  const response = await fetch(
    `${API_BASE_URL}/devices/${encodeURIComponent(token)}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error(`Failed to unregister device: ${response.status}`);
  }

  return response.json();
}

export async function requestNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  return status === 'granted';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'General notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#208AEF',
    sound: 'default',
  });
}

/**
 * Returns the native FCM (Android) / APNs (iOS) token so the backend can send
 * directly through Firebase Cloud Messaging.
 */
export async function registerForPushNotifications(userId?: string | null) {
  if (Platform.OS === 'web') {
    return null;
  }

  // Android requires a channel before the permission prompt can appear.
  await ensureAndroidChannel();

  if (!Device.isDevice) {
    console.warn('Push notifications are only available on a physical device');
    return null;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('Notification permission was not granted');
    return null;
  }

  const { data: deviceToken } = await Notifications.getDevicePushTokenAsync();
  if (!deviceToken) {
    return null;
  }

  await registerDevice({
    token: deviceToken,
    platform: Platform.OS,
    userId: userId ?? null,
  });

  // Keep the registry in sync if FCM rotates the token while the app runs.
  Notifications.addPushTokenListener(({ data: token }) => {
    registerDevice({ token, platform: Platform.OS, userId: userId ?? null }).catch((error) => {
      console.warn('Failed to refresh push token:', error);
    });
  });

  return deviceToken;
}

export function onNotificationReceived(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function onNotificationResponse(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

export function getExpoProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function getExpoPushToken() {
  const projectId = getExpoProjectId();
  if (!projectId) {
    return null;
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}