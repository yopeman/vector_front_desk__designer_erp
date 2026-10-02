import { asyncHandler } from '../middleware/index.js';
import { handleDatabaseChange } from '../services/webhook.service.js';

export const databaseChange = asyncHandler(async (req, res) => {
  console.log('[webhook] dbChange', req.body);

  const result = await handleDatabaseChange(req.body);
  res.json(result);
});