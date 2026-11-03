import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  addWardrobeImage,
  listWardrobeImages,
  removeWardrobeImage,
} from '../services/wardrobe.service.js';

export const wardrobeController = {
  list: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await listWardrobeImages(req.user._id));
  }),

  add: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await addWardrobeImage(req.user._id, req.file), undefined, 201);
  }),

  remove: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await removeWardrobeImage(req.user._id, req.params.imageId));
  }),
};
