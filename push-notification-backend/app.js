import 'dotenv/config';

import express from 'express';

import { listDevices, getTokens, removeDevice, removeDevices, saveDevice } from './lib/device-store.js';
import { initFirebase, messaging } from './lib/firebase.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const SOUND_NAME = process.env.NOTIFICATION_SOUND ?? 'notification_sound.mp3';

app.use(express.json({ limit: '1mb' }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null);
  if (missing.length > 0) {
    const error = new Error(`Missing required field(s): ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, devices: listDevices().length });
});

app.post(
  '/devices',
  asyncRoute((req, res) => {
    requireFields(req.body, ['token']);
    const device = saveDevice({
      token: String(req.body.token),
      platform: req.body.platform ? String(req.body.platform) : 'unknown',
      userId: req.body.userId ? String(req.body.userId) : null,
    });
    res.status(201).json({ ok: true, device });
  })
);

app.get('/devices', (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  res.json({ ok: true, count: listDevices({ userId }).length, devices: listDevices({ userId }) });
});

app.delete(
  '/devices/:token',
  asyncRoute((req, res) => {
    res.json({ ok: removeDevice(req.params.token) });
  })
);

app.post(
  '/notify',
  asyncRoute(async (req, res) => {
    requireFields(req.body, ['title']);

    const { title, body, data, tokens, userId, topic, priority = 'high' } = req.body;

    if (!body && !data) {
      const error = new Error('Provide either body or data');
      error.status = 400;
      throw error;
    }

    const payload = {
      notification: body ? { title, body } : undefined,
      data: normalizeData(data ?? {}),
      android: {
        priority,
        notification: {
          channelId: process.env.ANDROID_CHANNEL_ID ?? 'default',
          sound: SOUND_NAME,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: SOUND_NAME,
            ...(body ? {} : { 'content-available': 1 }),
          },
        },
      },
    };

    if (topic) {
      const messageId = await messaging().send({
        ...payload,
        topic: String(topic).replace(/[^a-zA-Z0-9-_.~%]/g, '-'),
      });
      return res.json({ ok: true, transport: 'topic', topic, messageId });
    }

    const targetTokens = getTokens({ userId, tokens });
    if (targetTokens.length === 0) {
      return res.status(404).json({ ok: false, error: 'No registered devices for target' });
    }

    const result = await messaging().sendEachForMulticast({
      ...payload,
      tokens: targetTokens,
    });

    const staleTokens = [
      ...result.responses
        .map((response, index) => ({ response, token: targetTokens[index] }))
        .filter(({ response }) => {
          const code = response.error?.code ?? '';
          return (
            code.includes('registration-token-not-registered') ||
            code.includes('invalid-argument')
          );
        })
        .map(({ token }) => token),
    ];

    if (staleTokens.length > 0) {
      removeDevices(staleTokens);
    }

    res.json({
      ok: true,
      transport: 'multicast',
      successCount: result.successCount,
      failureCount: result.failureCount,
      removedTokens: staleTokens.length,
      responses: result.responses,
    });
  })
);

function normalizeData(data) {
  return Object.fromEntries(
    Object.entries(data ?? {}).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ])
  );
}

app.use((error, _req, res, _next) => {
  const status = error.status ?? 500;
  if (status >= 500) {
    console.error('[error]', error);
  }
  res.status(status).json({ ok: false, error: error.message });
});

initFirebase();
app.listen(PORT, () => {
  console.log(`push-notification-backend listening on http://localhost:${PORT}`);
});