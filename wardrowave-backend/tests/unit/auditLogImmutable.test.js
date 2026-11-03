import { describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { AuditLog } from '../../src/models/AuditLog.js';

describe('AuditLog append-only behavior', () => {
  it.each([
    ['updateOne', () => AuditLog.updateOne({}, { $set: { action: 'changed' } })],
    ['updateMany', () => AuditLog.updateMany({}, { $set: { action: 'changed' } })],
    ['findOneAndUpdate', () => AuditLog.findOneAndUpdate({}, { $set: { action: 'changed' } })],
    ['findOneAndReplace', () => AuditLog.findOneAndReplace({}, { action: 'changed' })],
    ['replaceOne', () => AuditLog.replaceOne({}, { action: 'changed' })],
    ['deleteOne', () => AuditLog.deleteOne({})],
    ['deleteMany', () => AuditLog.deleteMany({})],
    ['findOneAndDelete', () => AuditLog.findOneAndDelete({})],
  ])('rejects %s mutations', async (_operation, createQuery) => {
    await expect(createQuery().exec()).rejects.toThrow('Audit logs are append-only');
  });

  it('rejects saving an existing audit document', async () => {
    const entry = new AuditLog({
      actor: new mongoose.Types.ObjectId(),
      actorRole: 'admin',
      action: 'test.action',
      entityType: 'User',
      entityId: new mongoose.Types.ObjectId(),
    });
    entry.isNew = false;

    await expect(entry.save()).rejects.toThrow('Audit logs are append-only');
  });
});
