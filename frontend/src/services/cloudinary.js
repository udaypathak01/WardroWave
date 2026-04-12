// src/services/cloudinary.js
// Cloudinary image upload service

import axios from "axios";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Validates if file is an image and under size limit
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Max file size in MB (default: 2)
 * @returns {object} - { valid: boolean, error: string|null }
 */
export const validateImageFile = (file, maxSizeMB = 2) => {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Only image files are allowed (.jpg, .png, .gif, etc.)" };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be under ${maxSizeMB}MB` };
  }

  return { valid: true, error: null };
};

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - Secure URL of uploaded image
 */
export const uploadToCloudinary = async (file) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary configuration missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env"
    );
  }

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      secure_url: response.data.secure_url,
      public_id: response.data.public_id,
      height: response.data.height,
      width: response.data.width,
      format: response.data.format,
      bytes: response.data.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Upload failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Delete image from Cloudinary (requires signed API key)
 * @param {string} publicId - Public ID of image to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromCloudinary = async (publicId) => {
  // Note: For unsigned delete, you would need to set up a backend endpoint
  // This is just a placeholder for reference
  console.warn("Unsigned delete not supported. Use backend endpoint for secure deletion.");
  return false;
};
