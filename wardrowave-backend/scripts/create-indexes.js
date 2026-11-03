import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';
import '../src/models/index.js';

try {
  await connectDatabase();
  for (const model of Object.values(mongoose.models)) {
    await model.syncIndexes();
    logger.info({ model: model.modelName }, 'Model indexes synchronized');
  }
} catch (error) {
  logger.error({ err: error }, 'Index synchronization failed');
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
