import { beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { InventoryUnit } from '../../src/models/InventoryUnit.js';
import { Reservation } from '../../src/models/Reservation.js';
import {
  getAvailabilityCount,
  getAvailableProductIds,
  getAvailableUnits,
  getBlockedDateRanges,
  getNextAvailableDate,
  isValidAvailabilityId,
} from '../../src/services/availability.service.js';
import { addCalendarDays, computeBlockWindow, formatRentalDate, parseRentalDate } from '../../src/utils/dates.js';
import { createProductWithUnits, createUser } from '../helpers/factories.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
let user;
let startDate;
let endDate;
let product;
let variant;
let units;

beforeEach(async () => {
  if (!enabled) return;
  user = await createUser();
  ({ product, variant, units } = await createProductWithUnits({ unitCount: 2 }));
  startDate = formatRentalDate(addCalendarDays(new Date(), 20));
  endDate = formatRentalDate(addCalendarDays(new Date(startDate), 2));
});

async function reserve(unit, blockStart, blockEnd, status = 'confirmed', holdExpiresAt) {
  return Reservation.create({
    unit: unit._id,
    variant: variant._id,
    product: product._id,
    user: user._id,
    rentalStart: parseRentalDate(startDate),
    rentalEnd: parseRentalDate(endDate),
    blockStart,
    blockEnd,
    status,
    ...(holdExpiresAt ? { holdExpiresAt } : {}),
  });
}

describe('rental availability integration', () => {
  integrationIt('counts buffered availability and ignores expired holds', async () => {
    const window = computeBlockWindow(startDate, endDate, 1, 2);
    await reserve(units[0], window.blockStart, window.blockEnd);
    await reserve(units[1], window.blockStart, window.blockEnd, 'held', new Date(Date.now() - 60_000));

    await expect(getAvailabilityCount(variant._id, startDate, endDate)).resolves.toBe(1);
    await InventoryUnit.updateOne({ _id: units[1]._id }, { $set: { status: 'cleaning' } });
    await expect(getAvailabilityCount(variant._id, startDate, endDate)).resolves.toBe(0);
    await expect(getAvailabilityCount(new mongoose.Types.ObjectId(), startDate, endDate))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  integrationIt('counts only operational units without a current overlapping reservation', async () => {
    const window = computeBlockWindow(startDate, endDate, 1, 2);
    await reserve(units[0], window.blockStart, window.blockEnd);
    await reserve(units[1], window.blockStart, window.blockEnd, 'held', new Date(Date.now() - 60_000));

    const available = await getAvailableUnits({
      variantId: variant._id,
      ...window,
      now: new Date(),
    });

    expect(available.map(({ _id }) => String(_id))).toEqual([String(units[1]._id)]);
    await InventoryUnit.updateOne({ _id: units[1]._id }, { $set: { status: 'cleaning' } });
    await expect(getAvailableUnits({ variantId: variant._id, ...window })).resolves.toEqual([]);
  });

  integrationIt('returns only products with at least one free active variant unit', async () => {
    const second = await createProductWithUnits();
    const window = computeBlockWindow(startDate, endDate, 1, 2);
    await reserve(units[0], window.blockStart, window.blockEnd);
    await reserve(units[1], window.blockStart, window.blockEnd);

    const result = await getAvailableProductIds(
      [product, second.product],
      startDate,
      endDate,
      { now: new Date() }
    );

    expect(result).toEqual([String(second.product._id)]);
    await expect(getAvailableProductIds([], startDate, endDate)).resolves.toEqual([]);

    await InventoryUnit.updateMany(
      { product: second.product._id },
      { $set: { status: 'cleaning' } }
    );
    expect(await getAvailableProductIds([second.product], startDate, endDate)).toEqual([]);
  });

  integrationIt('merges adjacent blocked dates into one range and finds the next available rental date', async () => {
    const blockedStart = formatRentalDate(addCalendarDays(new Date(startDate), 1));
    const blockedEnd = formatRentalDate(addCalendarDays(new Date(startDate), 2));
    await reserve(units[0], parseRentalDate(blockedStart), parseRentalDate(blockedEnd));
    await reserve(units[1], parseRentalDate(blockedStart), parseRentalDate(blockedEnd));

    const ranges = await getBlockedDateRanges(
      product._id,
      variant._id,
      startDate,
      formatRentalDate(addCalendarDays(new Date(startDate), 4))
    );
    expect(ranges).toEqual([{ startDate: blockedStart, endDate: blockedEnd }]);

    const nextDate = await getNextAvailableDate(variant._id, startDate, 1);
    expect(nextDate).toBe(formatRentalDate(addCalendarDays(new Date(startDate), 4)));
    expect(isValidAvailabilityId(String(variant._id))).toBe(true);
    expect(isValidAvailabilityId('invalid-id')).toBe(false);
    await expect(getNextAvailableDate(variant._id, startDate, 0))
      .rejects.toMatchObject({ statusCode: 400 });
    await expect(getNextAvailableDate(new mongoose.Types.ObjectId(), startDate, 1))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  integrationIt('reports the whole date range when no operational units exist and validates bounds', async () => {
    await InventoryUnit.updateMany(
      { product: product._id },
      { $set: { status: 'retired' } }
    );
    const ranges = await getBlockedDateRanges(product._id, variant._id, startDate, endDate);
    expect(ranges).toEqual([{ startDate, endDate }]);

    await expect(getBlockedDateRanges(
      product._id,
      variant._id,
      startDate,
      formatRentalDate(addCalendarDays(new Date(startDate), 367))
    )).rejects.toMatchObject({ statusCode: 400 });
    await expect(getBlockedDateRanges(
      product._id,
      new mongoose.Types.ObjectId(),
      startDate,
      endDate
    )).rejects.toMatchObject({ statusCode: 404 });
  });
});
