import { createServer } from 'http';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { initSocket } from './socket';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] Listening on http://localhost:${env.port}`);
    console.log(`[server] Accepting client connections from ${env.clientUrl}`);
  });
}

bootstrap().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
