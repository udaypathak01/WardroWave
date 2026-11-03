import { WardrobeImage } from '../models/WardrobeImage.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { deleteAsset, uploadBuffer } from './upload.service.js';

export async function listWardrobeImages(userId) {
  return WardrobeImage.find({ user: userId })
    .select('_id url width height bytes format createdAt')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

export async function addWardrobeImage(userId, file) {
  const uploaded = await uploadBuffer(file.buffer, {
    folder: `${env.CLOUDINARY_FOLDER}/users/${userId}`,
    publicIdPrefix: 'wardrobe',
  });
  try {
    const image = await WardrobeImage.create({
      user: userId,
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      bytes: file.size,
      format: file.mimetype.slice('image/'.length),
    });
    return {
      _id: image._id,
      url: image.url,
      width: image.width,
      height: image.height,
      bytes: image.bytes,
      format: image.format,
      createdAt: image.createdAt,
    };
  } catch (error) {
    await deleteAsset(uploaded.publicId);
    throw error;
  }
}

export async function removeWardrobeImage(userId, imageId) {
  const image = await WardrobeImage.findOneAndDelete({ _id: imageId, user: userId })
    .lean()
    .exec();
  if (!image) throw new ApiError(404, 'Wardrobe image not found');
  await deleteAsset(image.publicId);
  return { deleted: true };
}
