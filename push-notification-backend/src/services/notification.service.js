import { messaging } from '../config/firebase.js';
import { config } from '../config/index.js';
import { resolveTokens, unregisterDevices } from './device.service.js';

function normalizeData(data) {
  return Object.fromEntries(
    Object.entries(data ?? {}).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]),
  );
}

function buildPayload({ title, body, data, priority }) {
  return {
    notification: body ? { title, body } : undefined,
    data: normalizeData(data ?? {}),
    android: {
      priority,
      notification: {
        channelId: config.notification.androidChannelId,
        sound: config.notification.sound,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: config.notification.sound,
          ...(body ? {} : { 'content-available': 1 }),
        },
      },
    },
  };
}

const STALE_TOKEN_CODES = ['registration-token-not-registered', 'invalid-argument'];

function isStaleToken(response) {
  const code = response.error?.code ?? '';
  return STALE_TOKEN_CODES.some((staleCode) => code.includes(staleCode));
}

export async function sendToTopic({ title, body, data, priority, topic }) {
  const messageId = await messaging().send({
    ...buildPayload({ title, body, data, priority }),
    topic: String(topic).replace(/[^a-zA-Z0-9-_.~%]/g, '-'),
  });

  return { ok: true, transport: 'topic', topic, messageId };
}

export async function sendToDevices({ title, body, data, priority, tokens, userId }) {
  const targetTokens = await resolveTokens({ userId, tokens });
  if (targetTokens.length === 0) {
    return { ok: false, status: 404, error: 'No registered devices for target' };
  }

  const result = await messaging().sendEachForMulticast({
    ...buildPayload({ title, body, data, priority }),
    tokens: targetTokens,
  });

  const staleTokens = result.responses
    .map((response, index) => ({ response, token: targetTokens[index] }))
    .filter(({ response }) => isStaleToken(response))
    .map(({ token }) => token);

  if (staleTokens.length > 0) {
    await unregisterDevices(staleTokens);
  }

  return {
    ok: true,
    transport: 'multicast',
    successCount: result.successCount,
    failureCount: result.failureCount,
    removedTokens: staleTokens.length,
    responses: result.responses,
  };
}

export function dispatchNotification(payload) {
  return payload.topic ? sendToTopic(payload) : sendToDevices(payload);
}