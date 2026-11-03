import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  deliverBooking,
  dispatchBooking,
  receiveReturn,
} from '../services/fulfillment.service.js';
import { inspectReturn, markUnitClean } from '../services/returnInspection.service.js';

function requestContext(req) {
  return { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.id };
}

export const staffController = {
  /**
   * Dispatches a booking with its carrier and tracking information.
   */
  dispatch: asyncHandler(async (req, res) => {
    const booking = await dispatchBooking({
      bookingId: req.params.id,
      actor: req.user,
      ...req.body,
      request: requestContext(req),
    });
    ApiResponse.success(res, booking);
  }),

  /**
   * Records delivery for a dispatched booking.
   */
  deliver: asyncHandler(async (req, res) => {
    const booking = await deliverBooking({
      bookingId: req.params.id,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, booking);
  }),

  /**
   * Receives a requested return into the warehouse.
   */
  receive: asyncHandler(async (req, res) => {
    const booking = await receiveReturn({
      bookingId: req.params.id,
      actor: req.user,
      ...req.body,
      request: requestContext(req),
    });
    ApiResponse.success(res, booking);
  }),

  /**
   * Inspects all returned items and applies deposit deductions.
   */
  inspect: asyncHandler(async (req, res) => {
    const result = await inspectReturn({
      bookingId: req.params.id,
      actor: req.user,
      items: req.body.items,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Marks an inspected cleaning unit clean and ready for future reservations.
   */
  markClean: asyncHandler(async (req, res) => {
    const unit = await markUnitClean({
      unitId: req.params.unitId,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, unit);
  }),
};
