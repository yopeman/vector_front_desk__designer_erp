const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    schema: process.env.SUPABASE_SCHEMA ?? 'public',
    devicesTable: process.env.SUPABASE_DEVICES_TABLE ?? 'push_devices',
  },

  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  },

  notification: {
    sound: process.env.NOTIFICATION_SOUND ?? 'notification_sound.mp3',
    androidChannelId: process.env.ANDROID_CHANNEL_ID ?? 'default',
    defaultPriority: process.env.NOTIFICATION_PRIORITY ?? 'high',
  },
};