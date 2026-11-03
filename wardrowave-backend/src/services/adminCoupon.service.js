import { Category } from '../models/Category.js';
import { Coupon } from '../models/Coupon.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';

async function auditCoupon({ coupon, actor, action, summary, request, session }) {
  await writeAuditLog({
    actor: actor._id,
    actorRole: actor.role,
    action,
    entityType: 'Coupon',
    entityId: coupon._id,
    summary,
    ip: request.ip,
    userAgent: request.userAgent,
    requestId: request.requestId,
    session,
  });
}

async function validateAssociations(input, session) {
  const [categoryCount, productCount] = await Promise.all([
    input.applicableCategories.length
      ? Category.countDocuments({ _id: { $in: input.applicableCategories }, isActive: true }).session(session)
      : 0,
    input.applicableProducts.length
      ? Product.countDocuments({ _id: { $in: input.applicableProducts }, status: 'published', deletedAt: null }).session(session)
      : 0,
  ]);
  if (categoryCount !== new Set(input.applicableCategories).size) {
    throw new ApiError(400, 'One or more coupon categories are missing or inactive');
  }
  if (productCount !== new Set(input.applicableProducts).size) {
    throw new ApiError(400, 'One or more coupon products are missing or unpublished');
  }
}

/**
 * Creates a coupon after validating all targeted catalog records.
 */
export async function createCoupon({ actor, input, request }) {
  return withTransaction(async (session) => {
    await validateAssociations(input, session);
    const [coupon] = await Coupon.create(
      [{ ...input, code: input.code.toUpperCase() }],
      { session }
    );
    await auditCoupon({
      coupon,
      actor,
      action: 'coupon.created',
      summary: { code: coupon.code, type: coupon.type, value: coupon.value },
      request,
      session,
    });
    return coupon.toJSON();
  });
}

/**
 * Updates mutable coupon availability and usage configuration.
 */
export async function updateCoupon({ couponId, actor, input, request }) {
  return withTransaction(async (session) => {
    const coupon = await Coupon.findById(couponId).session(session).exec();
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    const startsAt = input.startsAt ? new Date(input.startsAt) : coupon.startsAt;
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : coupon.expiresAt;
    if (expiresAt <= startsAt) throw new ApiError(400, 'Coupon expiry must be after its start');
    if (
      input.usageLimit != null &&
      input.usageLimit < coupon.usedCount + coupon.reservedCount
    ) {
      throw new ApiError(409, 'Usage limit cannot be lower than used and reserved redemptions');
    }
    Object.assign(coupon, input);
    await coupon.save({ session });
    await auditCoupon({
      coupon,
      actor,
      action: 'coupon.updated',
      summary: { fields: Object.keys(input) },
      request,
      session,
    });
    return coupon.toJSON();
  });
}
