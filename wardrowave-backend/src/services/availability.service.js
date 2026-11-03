import { addDays, differenceInCalendarDays, format } from 'date-fns';
import mongoose from 'mongoose';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Reservation } from '../models/Reservation.js';
import { Variant } from '../models/Variant.js';
import { ApiError } from '../utils/ApiError.js';
import { computeBlockWindow, normalizeCalendarDate } from '../utils/dates.js';

const BLOCKING_STATUSES = ['confirmed', 'active'];

function blockingFilter(now) {
  return {
    $or: [
      { status: { $in: BLOCKING_STATUSES } },
      { status: 'held', holdExpiresAt: { $gt: now } },
    ],
  };
}

/**
 * Returns operationally usable physical units with no overlapping reservation.
 */
export async function getAvailableUnits({ variantId, blockStart, blockEnd, session, now = new Date() }) {
  const start = normalizeCalendarDate(blockStart);
  const end = normalizeCalendarDate(blockEnd);
  if (end < start) {
    throw new ApiError(400, 'Block end must not precede block start', { code: 'INVALID_DATES' });
  }

  const units = await InventoryUnit.find({
    variant: variantId,
    status: { $nin: ['maintenance', 'retired', 'cleaning'] },
  })
    .sort({ rentCount: 1, unitCode: 1 })
    .session(session ?? null)
    .lean()
    .exec();
  if (units.length === 0) return [];

  const reservations = await Reservation.find({
    unit: { $in: units.map((unit) => unit._id) },
    blockStart: { $lte: end },
    blockEnd: { $gte: start },
    ...blockingFilter(now),
  })
    .select('unit')
    .session(session ?? null)
    .lean()
    .exec();
  const occupiedIds = new Set(reservations.map((reservation) => reservation.unit.toString()));
  return units.filter((unit) => !occupiedIds.has(unit._id.toString()));
}

/**
 * Counts free units for rental dates after applying product buffer rules.
 */
export async function getAvailabilityCount(variantId, startDate, endDate, options = {}) {
  const variant = await Variant.findById(variantId)
    .populate({ path: 'product', select: 'pricing' })
    .session(options.session ?? null)
    .lean()
    .exec();
  if (!variant || !variant.product) {
    throw new ApiError(404, 'Variant not found');
  }

  const pricing = variant.product.pricing ?? {};
  const window = computeBlockWindow(
    startDate,
    endDate,
    pricing.deliveryBufferDays ?? 1,
    pricing.returnBufferDays ?? 2
  );
  const units = await getAvailableUnits({ variantId, ...window, ...options });
  return units.length;
}

/**
 * Finds products with at least one free unit for the requested rental dates using batched queries.
 */
export async function getAvailableProductIds(products, startDate, endDate, options = {}) {
  if (products.length === 0) return [];

  const session = options.session ?? null;
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const variants = await Variant.find({
    product: { $in: products.map((product) => product._id) },
    isActive: true,
  }).select('_id product').session(session).lean().exec();
  if (variants.length === 0) return [];

  const variantProduct = new Map(variants.map((variant) => [
    String(variant._id),
    String(variant.product),
  ]));
  const windows = new Map();
  for (const product of products) {
    windows.set(String(product._id), computeBlockWindow(
      startDate,
      endDate,
      product.pricing?.deliveryBufferDays ?? 1,
      product.pricing?.returnBufferDays ?? 2
    ));
  }
  const units = await InventoryUnit.find({
    variant: { $in: variants.map((variant) => variant._id) },
    status: { $nin: ['maintenance', 'retired', 'cleaning'] },
  }).select('_id variant').session(session).lean().exec();
  if (units.length === 0) return [];

  const allWindows = [...windows.values()];
  const reservations = await Reservation.find({
    unit: { $in: units.map((unit) => unit._id) },
    blockStart: { $lte: new Date(Math.max(...allWindows.map(({ blockEnd }) => blockEnd.getTime()))) },
    blockEnd: { $gte: new Date(Math.min(...allWindows.map(({ blockStart }) => blockStart.getTime()))) },
    ...blockingFilter(options.now ?? new Date()),
  }).select('unit blockStart blockEnd').session(session).lean().exec();
  const reservationsByUnit = new Map();
  for (const reservation of reservations) {
    const unitId = String(reservation.unit);
    if (!reservationsByUnit.has(unitId)) reservationsByUnit.set(unitId, []);
    reservationsByUnit.get(unitId).push(reservation);
  }

  const freeProductIds = new Set();
  for (const unit of units) {
    const productId = variantProduct.get(String(unit.variant));
    const product = productById.get(productId);
    const window = windows.get(productId);
    const overlaps = (reservationsByUnit.get(String(unit._id)) ?? []).some((reservation) =>
      reservation.blockStart <= window.blockEnd && reservation.blockEnd >= window.blockStart
    );
    if (product && !overlaps) freeProductIds.add(String(product._id));
  }
  return [...freeProductIds];
}

/**
 * Finds calendar days with no free unit, merging adjacent blocked days.
 */
export async function getBlockedDateRanges(productId, variantId, fromDate, toDate, options = {}) {
  const start = normalizeCalendarDate(fromDate);
  const end = normalizeCalendarDate(toDate);
  const span = differenceInCalendarDays(end, start);
  if (span < 0 || span > 366) {
    throw new ApiError(400, 'Date range must be ordered and no longer than 12 months', {
      code: 'INVALID_DATES',
    });
  }
  const variant = await Variant.findOne({ _id: variantId, product: productId, isActive: true })
    .session(options.session ?? null)
    .lean()
    .exec();
  if (!variant) throw new ApiError(404, 'Product variant not found');

  const units = await InventoryUnit.find({
    product: productId,
    variant: variantId,
    status: { $nin: ['maintenance', 'retired', 'cleaning'] },
  })
    .select('_id')
    .session(options.session ?? null)
    .lean()
    .exec();
  if (units.length === 0) {
    return [{ startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') }];
  }

  const reservations = await Reservation.find({
    unit: { $in: units.map((unit) => unit._id) },
    blockStart: { $lte: end },
    blockEnd: { $gte: start },
    ...blockingFilter(options.now ?? new Date()),
  })
    .select('unit blockStart blockEnd')
    .session(options.session ?? null)
    .lean()
    .exec();

  const unavailable = [];
  for (let offset = 0; offset <= span; offset += 1) {
    const day = addDays(start, offset);
    const occupiedUnits = new Set(
      reservations
        .filter((reservation) => reservation.blockStart <= day && reservation.blockEnd >= day)
        .map((reservation) => reservation.unit.toString())
    );
    unavailable.push(occupiedUnits.size === units.length);
  }

  const ranges = [];
  let rangeStart = null;
  for (let offset = 0; offset <= span + 1; offset += 1) {
    const isBlocked = offset <= span && unavailable[offset];
    if (isBlocked && rangeStart === null) rangeStart = addDays(start, offset);
    if (!isBlocked && rangeStart !== null) {
      ranges.push({
        startDate: format(rangeStart, 'yyyy-MM-dd'),
        endDate: format(addDays(start, offset - 1), 'yyyy-MM-dd'),
      });
      rangeStart = null;
    }
  }
  return ranges;
}

/**
 * Suggests the earliest available rental start for the requested duration.
 */
export async function getNextAvailableDate(variantId, afterDate, days, options = {}) {
  if (!Number.isInteger(days) || days < 1) {
    throw new ApiError(400, 'Rental duration must be a positive whole number', { code: 'INVALID_DATES' });
  }
  const variant = await Variant.findById(variantId)
    .populate({ path: 'product', select: 'pricing' })
    .session(options.session ?? null)
    .lean()
    .exec();
  if (!variant?.product) throw new ApiError(404, 'Variant not found');

  const pricing = variant.product.pricing ?? {};
  const start = normalizeCalendarDate(afterDate);
  for (let offset = 0; offset <= 366; offset += 1) {
    const candidateStart = addDays(start, offset);
    const candidateEnd = addDays(candidateStart, days - 1);
    const window = computeBlockWindow(
      candidateStart,
      candidateEnd,
      pricing.deliveryBufferDays ?? 1,
      pricing.returnBufferDays ?? 2
    );
    const available = await getAvailableUnits({ variantId, ...window, ...options });
    if (available.length > 0) return format(candidateStart, 'yyyy-MM-dd');
  }
  return null;
}

/**
 * Validates an ObjectId string before it is sent to MongoDB.
 */
export function isValidAvailabilityId(id) {
  return mongoose.isValidObjectId(id);
}
