import mongoose from 'mongoose';

const emailOutboxSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    template: { type: String, default: 'generic' },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['queued', 'sending', 'sent', 'failed', 'dead'], default: 'queued' },
    attempts: { type: Number, default: 0, min: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lastError: String,
    sentAt: Date,
  },
  { timestamps: true, versionKey: false }
);

emailOutboxSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

export const EmailOutbox = mongoose.model('EmailOutbox', emailOutboxSchema);
