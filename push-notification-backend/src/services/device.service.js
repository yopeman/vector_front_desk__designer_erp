import {
  countDevices,
  deleteDevice,
  deleteDevices,
  findOrCreateDevice,
  selectDevices,
} from '../models/device.model.js';

export function registerDevice({ token, platform, userId }) {
  return findOrCreateDevice({
    token,
    platform: platform || 'unknown',
    userId: userId || null,
  });
}

export function listDevices({ userId } = {}) {
  return selectDevices({ userId });
}

export function unregisterDevice(token) {
  return deleteDevice(token);
}

export function unregisterDevices(tokens) {
  return deleteDevices(tokens);
}

export function deviceCount() {
  return countDevices();
}

export async function resolveTokens({ userId, tokens } = {}) {
  if (Array.isArray(tokens) && tokens.length > 0) {
    return [...new Set(tokens)];
  }

  if (userId) {
    const devices = await selectDevices({ userId });
    return devices.map((device) => device.token);
  }

  const devices = await selectDevices();
  return devices.map((device) => device.token);
}