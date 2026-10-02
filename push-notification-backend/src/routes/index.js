import { Router } from 'express';

import {
  createDevice,
  getDevices,
  health,
  removeDevice,
} from '../controllers/device.controller.js';
import { notify } from '../controllers/notification.controller.js';
import { databaseChange } from '../controllers/webhook.controller.js';

export const router = Router();

router.get('/health', health);

router.post('/devices', createDevice);
router.get('/devices', getDevices);
router.delete('/devices/:token', removeDevice);

router.post('/notify', notify);
router.post('/change', databaseChange);

export default router;