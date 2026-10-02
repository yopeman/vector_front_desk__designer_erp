import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { config } from './index.js';

export function initFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const { projectId, clientEmail, privateKey } = config.firebase;

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // .env values may keep the PEM newlines escaped as \n
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export function messaging() {
  return getMessaging(initFirebase());
}