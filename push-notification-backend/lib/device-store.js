import fs from 'node:fs';
import path from 'node:path';

const DATA_FILE = path.resolve(process.cwd(), 'data', 'devices.json');

/** @type {Map<string, {token: string, platform: string, userId: string|null, updatedAt: string, createdAt: string}>} */
const devices = new Map();

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    for (const entry of parsed.devices ?? []) {
      devices.set(entry.token, entry);
    }
    console.log(`[store] loaded ${devices.size} device(s)`);
  } catch (error) {
    console.error('[store] failed to load devices.json:', error.message);
  }
}

function persist() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ devices: [...devices.values()] }, null, 2));
}

load();

export function saveDevice({ token, platform = 'unknown', userId = null }) {
  const now = new Date().toISOString();
  const existing = devices.get(token);

  const device = {
    token,
    platform,
    userId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  devices.set(token, device);
  persist();
  return device;
}

export function removeDevice(token) {
  const removed = devices.delete(token);
  if (removed) {
    persist();
  }
  return removed;
}

export function removeDevices(tokens) {
  const removed = [];
  for (const token of tokens) {
    if (devices.delete(token)) {
      removed.push(token);
    }
  }
  if (removed.length > 0) {
    persist();
  }
  return removed;
}

export function listDevices({ userId } = {}) {
  const all = [...devices.values()];
  return userId ? all.filter((device) => device.userId === userId) : all;
}

export function getTokens({ userId, tokens } = {}) {
  if (Array.isArray(tokens) && tokens.length > 0) {
    return [...new Set(tokens)];
  }
  if (userId) {
    return listDevices({ userId }).map((device) => device.token);
  }
  return [...devices.keys()];
}