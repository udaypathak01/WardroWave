import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  addAddress,
  changeUserAccess,
  deleteAccount,
  deleteAddress,
  getProfile,
  listNotifications,
  markNotificationRead,
  updateAddress,
  updateAvatar,
  updateProfile,
} from '../services/user.service.js';

export const userController = {
  /**
   * Reads the authenticated customer's profile.
   */
  getMe: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getProfile(req.user._id));
  }),

  /**
   * Updates customer-editable profile attributes.
   */
  updateMe: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await updateProfile(req.user._id, req.body));
  }),

  /**
   * Replaces the authenticated customer's avatar image.
   */
  updateAvatar: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await updateAvatar(req.user._id, req.file));
  }),

  /**
   * Adds an address to the authenticated customer's profile.
   */
  addAddress: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await addAddress(req.user._id, req.body), undefined, 201);
  }),

  /**
   * Updates an address owned by the authenticated customer.
   */
  updateAddress: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await updateAddress(req.user._id, req.params.addressId, req.body));
  }),

  /**
   * Removes an address owned by the authenticated customer.
   */
  deleteAddress: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await deleteAddress(req.user._id, req.params.addressId));
  }),

  /**
   * Anonymizes the customer and deletes the associated Firebase identity.
   */
  deleteMe: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await deleteAccount(req.user._id));
  }),

  deleteCustomer: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await deleteAccount(req.params.id, {
      actor: req.user,
      request: { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.id },
    }));
  }),

  updateAccess: asyncHandler(async (req, res) => {
    const user = await changeUserAccess({
      targetUserId: req.params.id,
      actor: req.user,
      ...req.body,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id,
    });
    ApiResponse.success(res, user);
  }),

  listNotifications: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await listNotifications(req.user._id, req.query));
  }),

  markNotificationRead: asyncHandler(async (req, res) => {
    ApiResponse.success(
      res,
      await markNotificationRead(req.user._id, req.params.notificationId)
    );
  }),
};
