import mongoose from 'mongoose';

/**
 * Runs a MongoDB transaction and retries errors labeled transient up to three times.
 */
export async function withTransaction(fn) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } catch (error) {
      const transient = error.hasErrorLabel?.('TransientTransactionError') ||
        error.hasErrorLabel?.('UnknownTransactionCommitResult');
      if (!transient || attempt === maxAttempts) throw error;
    } finally {
      await session.endSession();
    }
  }
  throw new Error('Transaction retry loop ended unexpectedly');
}
