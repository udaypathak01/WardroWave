import { InventoryUnit } from '../models/InventoryUnit.js';

/**
 * Completes expired cleaning holds with a bulk conditional update.
 */
export async function completeExpiredCleaning(now = new Date()) {
  const eligible = await InventoryUnit.find({
    status: 'cleaning',
    cleaningUntil: { $lte: now },
  })
    .select('_id rentCount maxRentCount')
    .lean()
    .exec();
  const operations = eligible.map((unit) => {
    const status = unit.rentCount >= unit.maxRentCount ? 'retired' : 'available';
    const setFields = { status };
    if (status === 'available') setFields.lastCleanedAt = now;
    return {
      updateOne: {
        filter: { _id: unit._id, status: 'cleaning', cleaningUntil: { $lte: now } },
        update: { $set: setFields, $unset: { cleaningUntil: 1 } },
      },
    };
  });
  if (!operations.length) return 0;
  const result = await InventoryUnit.bulkWrite(operations, { ordered: false });
  return result.modifiedCount;
}
