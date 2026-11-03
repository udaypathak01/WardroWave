import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  getAdminBooking,
  getAdminCoupon,
  getAdminCustomer,
  getAdminDashboard,
  getAdminProduct,
  listAdminAuditLogs,
  listAdminBookings,
  listAdminCategories,
  listAdminCoupons,
  listAdminCustomers,
  listAdminInventory,
  listAdminPayments,
  listAdminProducts,
  listAdminReviews,
} from '../services/adminRead.service.js';

function sendPage(res, result) {
  ApiResponse.success(res, result.items, result.meta);
}

export const adminReadController = {
  dashboard: asyncHandler(async (_req, res) => {
    ApiResponse.success(res, await getAdminDashboard());
  }),
  bookings: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminBookings(req.query));
  }),
  booking: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getAdminBooking(req.params.id));
  }),
  customers: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminCustomers(req.query));
  }),
  customer: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getAdminCustomer(req.params.id));
  }),
  products: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminProducts(req.query));
  }),
  product: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getAdminProduct(req.params.productId));
  }),
  categories: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminCategories(req.query));
  }),
  inventory: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminInventory(req.query));
  }),
  payments: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminPayments(req.query));
  }),
  coupons: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminCoupons(req.query));
  }),
  coupon: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getAdminCoupon(req.params.couponId));
  }),
  reviews: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminReviews(req.query));
  }),
  auditLogs: asyncHandler(async (req, res) => {
    sendPage(res, await listAdminAuditLogs(req.query));
  }),
};
