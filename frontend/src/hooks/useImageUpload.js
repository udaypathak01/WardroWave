// src/hooks/useImageUpload.js
// Custom hook for managing image upload state and logic

import { useState } from "react";
import toast from "react-hot-toast";
import { uploadToCloudinary, validateImageFile } from "../services/cloudinary";
import { saveImageData } from "../services/firestore";

export const useImageUpload = (userId, initialMetadata = {}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);

  const validateAndSetFile = (selectedFile, maxSizeMB = 2) => {
    const validation = validateImageFile(selectedFile, maxSizeMB);
    
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      setPreview(null);
      return false;
    }

    setError(null);
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    
    return true;
  };

  const upload = async (fileToUpload = null, metadata = {}) => {
    const fileToProcess = fileToUpload || file;

    if (!fileToProcess || !userId) {
      const err = "Please select an image and ensure you're logged in";
      setError(err);
      throw new Error(err);
    }

    try {
      setLoading(true);
      setError(null);

      // Upload to Cloudinary
      const cloudinaryData = await uploadToCloudinary(fileToProcess);

      // Save to Firestore
      const docId = await saveImageData(
        cloudinaryData.secure_url,
        userId,
        {
          ...initialMetadata,
          ...metadata,
          publicId: cloudinaryData.public_id,
          width: cloudinaryData.width,
          height: cloudinaryData.height,
          format: cloudinaryData.format,
          bytes: cloudinaryData.bytes,
        }
      );

      const result = {
        docId,
        url: cloudinaryData.secure_url,
        cloudinaryData,
      };

      setUploadedData(result);
      setFile(null);
      setPreview(null);
      
      return result;
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadedData(null);
  };

  return {
    file,
    preview,
    loading,
    error,
    uploadedData,
    validateAndSetFile,
    upload,
    reset,
  };
};
