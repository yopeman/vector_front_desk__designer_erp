import express from 'express';

import { errorHandler, notFoundHandler } from './middleware/index.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;