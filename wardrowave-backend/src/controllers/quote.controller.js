import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { createQuote } from '../services/quote.service.js';

export const quoteController = {
  /**
   * Builds a server-priced quote from requested variant and rental dates.
   */
  create: asyncHandler(async (req, res) => {
    const result = await createQuote({
      ...req.body,
      user: req.user,
    });
    ApiResponse.success(res, result, undefined, 200);
  }),
};
