import { config } from '../config/index.js';
import { asyncHandler, requireFields } from '../middleware/index.js';
import { badRequest } from '../utils/http-error.js';
import { dispatchNotification } from '../services/notification.service.js';

export const notify = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title']);

  const { title, body, data, tokens, userId, topic, priority } = req.body;

  if (!body && !data) {
    throw badRequest('Provide either body or data');
  }

  const result = await dispatchNotification({
    title,
    body,
    data,
    tokens,
    userId: userId ? String(userId) : undefined,
    topic,
    priority: priority ?? config.notification.defaultPriority,
  });

  if (result.ok === false) {
    return res.status(result.status).json({ ok: false, error: result.error });
  }

  res.json(result);
});