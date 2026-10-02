import {
  deviceCount,
  listDevices,
  registerDevice,
  unregisterDevice,
} from '../services/device.service.js';
import { asyncHandler, requireFields } from '../middleware/index.js';
import { notFound } from '../utils/http-error.js';

export const health = asyncHandler(async (_req, res) => {
  res.json({ ok: true, devices: await deviceCount() });
});

export const createDevice = asyncHandler(async (req, res) => {
  requireFields(req.body, ['token']);
  const device = await registerDevice({
    token: String(req.body.token),
    platform: req.body.platform ? String(req.body.platform) : 'unknown',
    userId: req.body.userId ? String(req.body.userId) : null,
  });
  res.status(201).json({ ok: true, device });
});

export const getDevices = asyncHandler(async (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  const devices = await listDevices({ userId });
  res.json({ ok: true, count: devices.length, devices });
});

export const removeDevice = asyncHandler(async (req, res) => {
  const removed = await unregisterDevice(req.params.token);
  if (!removed) {
    throw notFound('Device token not registered');
  }
  res.json({ ok: true, removed: true });
});