import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { startJobs, stopJobs } from './jobs/index.js';
import { logger } from './utils/logger.js';

const app = createApp();
let server;
let shuttingDown = false;

async function bootstrap() {
  await connectDatabase();
  startJobs();
  server = app.listen(env.PORT, () => {
    logger.info(`WardroWave listening on port ${env.PORT}`);
  });
}

/**
 * Stops accepting requests, halts scheduled jobs, and closes MongoDB cleanly.
 */
async function shutdown(signal, error = undefined) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (error) logger.fatal({ err: error, signal }, 'Fatal process error');
  else logger.info({ signal }, 'Graceful shutdown started');

  stopJobs();
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((closeError) => (closeError ? reject(closeError) : resolve()));
      });
    }
    await disconnectDatabase();
    process.exitCode = error ? 1 : 0;
  } catch (shutdownError) {
    logger.error({ err: shutdownError }, 'Graceful shutdown failed');
    process.exitCode = 1;
  }
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Startup failed');
  process.exitCode = 1;
});

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => void shutdown('unhandledRejection', error));
process.on('uncaughtException', (error) => void shutdown('uncaughtException', error));
