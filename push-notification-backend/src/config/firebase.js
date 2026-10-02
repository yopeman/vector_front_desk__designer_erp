import fs from 'node:fs';
import path from 'node:path';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { config } from './index.js';

const FALLBACK_PATHS = [
  path.resolve(process.cwd(), 'service-account.json'),
  path.resolve(
    process.cwd(),
    '../vector-erp/vector-erp-9b02d-firebase-adminsdk-fbsvc-cedbebb6c8.json',
  ),
];

function resolveServiceAccount() {
  if (config.firebase.serviceAccountJson) {
    return JSON.parse(config.firebase.serviceAccountJson);
  }

  const candidates = [
    config.firebase.serviceAccountPath,
    ...FALLBACK_PATHS,
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error(
      'No Firebase service account found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.',
    );
  }

  process.env.FIREBASE_SERVICE_ACCOUNT_PATH = found;
  return JSON.parse(fs.readFileSync(found, 'utf8'));
}

export function initFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({ credential: cert(resolveServiceAccount()) });
}

export function messaging() {
  return getMessaging(initFirebase());
}