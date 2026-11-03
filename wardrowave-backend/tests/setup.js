import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach } from '@jest/globals';

global.jest = jest;
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/wardrowave-test?replicaSet=rs0';
process.env.REQUIRE_VERIFIED_EMAIL ??= 'false';
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_id';
process.env.RAZORPAY_KEY_SECRET ??= 'test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'test_webhook_secret';
process.env.LOG_LEVEL = 'silent';

const integrationEnabled = process.env.RUN_MONGO_INTEGRATION === 'true';
let replSet;

if (integrationEnabled) {
  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: '7.0.14' },
      replSet: { count: 1 },
    });
    await mongoose.connect(replSet.getUri());
  }, 120_000);

  beforeEach(async () => {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet?.stop();
  });
}
