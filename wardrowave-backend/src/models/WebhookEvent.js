import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
    status: { type: String, enum: ['received', 'processing', 'processed', 'failed'], default: 'received' },
    attempts: { type: Number, default: 0, min: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    processingStartedAt: Date,
    lastAttemptAt: Date,
    error: String,
    processedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
webhookEventSchema.index({ status: 1, nextAttemptAt: 1, attempts: 1 });
export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
