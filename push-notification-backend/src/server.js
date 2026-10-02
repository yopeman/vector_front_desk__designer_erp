import 'dotenv/config';

import { createApp } from './app.js';
import { config } from './config/index.js';
import { initFirebase } from './config/firebase.js';

initFirebase();

createApp().listen(config.port, () => {
  console.log(`push-notification-backend listening on http://localhost:${config.port}`);
});