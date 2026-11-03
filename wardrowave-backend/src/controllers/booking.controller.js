import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { createBooking, getBookingById, listBookings, retryPayment } from '../services/booking.service.js';
import { cancelBooking } from '../services/cancellation.service.js';
import { requestReturn } from '../services/fulfillment.service.js';
import { buildBookingInvoice } from '../services/invoice.service.js';
import { ApiError } from '../utils/ApiError.js';

export const bookingController = {
  list: asyncHandler(async (req, res) => {
    const result = await listBookings(req.user._id, req.query);
    ApiResponse.success(res, result.items, result.meta);
  }),

  create: asyncHandler(async (req, res) => {
    const result = await createBooking({
      user: req.user,
      body: req.body,
      idempotencyKey: req.get('Idempotency-Key'),
    });
    ApiResponse.success(res, result, undefined, result.idempotent ? 200 : 201);
  }),

  getOne: asyncHandler(async (req, res) => {
    const booking = await getBookingById(req.params.id, req.user._id);
    if (!booking) throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    ApiResponse.success(res, booking, undefined, 200);
  }),

  cancel: asyncHandler(async (req, res) => {
    const result = await cancelBooking({
      bookingId: req.params.id,
      userId: req.user._id,
      reason: req.body.reason,
    });
    ApiResponse.success(res, result, undefined, 200);
  }),

  retryPayment: asyncHandler(async (req, res) => {
    const result = await retryPayment({ bookingId: req.params.id, user: req.user });
    ApiResponse.success(res, result, undefined, 200);
  }),

  requestReturn: asyncHandler(async (req, res) => {
    const result = await requestReturn({
      bookingId: req.params.id,
      userId: req.user._id,
      pickupAt: req.body.pickupAt,
    });
    ApiResponse.success(res, result, undefined, 200);
  }),

  invoice: asyncHandler(async (req, res) => {
    const pdf = await buildBookingInvoice(req.params.id, req.user._id);
    res
      .status(200)
      .type('application/pdf')
      .attachment(`invoice-${req.params.id}.pdf`)
      .send(pdf);
  }),
};
