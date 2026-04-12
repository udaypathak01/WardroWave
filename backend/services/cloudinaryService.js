const cloudinary = require('cloudinary').v2;

// ─── Cloudinary Config ────────────────────────────────────────────────────────

const validateCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  const missing = [];
  if (!CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  return { isValid: missing.length === 0, missing };
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} filename - Original filename
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<Object>} - { secure_url, public_id, etc. }
 */
const uploadToCloudinary = (fileBuffer, filename, folder = 'wardrowave/virtual-closet') => {
  // Validate config before attempting upload
  const { isValid, missing } = validateCloudinaryConfig();
  if (!isValid) {
    return Promise.reject(new Error(
      `Cloudinary configuration incomplete. Missing: ${missing.join(', ')}. ` +
      `Please add these to your backend/.env file.`
    ));
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error) {
          const errorMsg = error.message || JSON.stringify(error);
          console.error('❌ Cloudinary upload error:', errorMsg);
          reject(new Error(`Cloudinary upload failed: ${errorMsg}`));
        } else {
          console.log('✅ Image uploaded to Cloudinary:', result.public_id);
          resolve(result);
        }
      }
    );

    uploadStream.on('error', (error) => {
      console.error('❌ Cloudinary stream error:', error.message);
      reject(new Error(`Cloudinary stream error: ${error.message}`));
    });

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const { isValid } = validateCloudinaryConfig();
    if (!isValid) {
      throw new Error('Cloudinary credentials not configured');
    }
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'not found') {
      console.warn(`⚠️ Cloudinary asset not found: ${publicId}`);
    } else {
      console.log('✅ Deleted from Cloudinary:', publicId);
    }
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw error;
  }
};

/**
 * Transform image URL with Cloudinary
 * @param {string} publicId - Public ID of image
 * @param {Object} transformations - Cloudinary transformation options
 * @returns {string} - Transformed URL
 */
const getTransformedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getTransformedUrl,
  validateCloudinaryConfig,
};
