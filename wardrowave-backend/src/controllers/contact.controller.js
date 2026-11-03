import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { submitContactMessage } from '../services/contact.service.js';

export const contactController = {
  submit: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await submitContactMessage(req.body), undefined, 202);
  }),
};
