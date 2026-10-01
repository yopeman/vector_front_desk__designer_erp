import fs from 'node:fs';
import path from 'node:path';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const DEFAULT_SERVICE_ACCOUNT_PATHS = [
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  path.resolve(process.cwd(), 'service-account.json'),
  path.resolve(
    process.cwd(),
    '../vector-erp/vector-erp-9b02d-firebase-adminsdk-fbsvc-cedbebb6c8.json'
  ),
].filter(Boolean);

function resolveServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const found = DEFAULT_SERVICE_ACCOUNT_PATHS.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error(
      'No Firebase service account found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }

  process.env.FIREBASE_SERVICE_ACCOUNT_PATH = found;
  return JSON.parse(fs.readFileSync(found, 'utf8'));
}

export function initFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(resolveServiceAccount()),
  });
}

export function messaging() {
  return getMessaging(initFirebase());
}