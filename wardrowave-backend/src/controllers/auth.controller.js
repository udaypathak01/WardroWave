import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { upsertUserFromFirebase } from '../services/auth.service.js';

export const authController = {
  sync: asyncHandler(async (req, res) => {
    const {
      uid,
      email,
      email_verified: emailVerified,
      name,
      picture,
      phone_number: phone,
    } = req.firebaseUser;
    const user = await upsertUserFromFirebase({
      uid,
      email,
      emailVerified,
      name,
      picture,
      phone: phone || req.body.phone,
    });
    ApiResponse.success(res, { user }, undefined, 200);
  }),
};
