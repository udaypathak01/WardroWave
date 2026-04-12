// src/components/common/ImageUpload.jsx
// Reusable image upload component with preview and validation

import React, { useState } from "react";
import toast from "react-hot-toast";
import { uploadToCloudinary, validateImageFile } from "../../services/cloudinary";
import { saveImageData } from "../../services/firestore";
import { Upload, X } from "lucide-react";

const ImageUpload = ({ 
  userId, 
  onSuccess, 
  onError,
  maxSizeMB = 2,
  metadata = {},
  className = "",
  actionText = "Upload Image"
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file
      const validation = validateImageFile(selectedFile, maxSizeMB);
      
      if (!validation.valid) {
        setError(validation.error);
        setFile(null);
        setPreview(null);
        toast.error(validation.error);
        return;
      }

      setError(null);
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      toast.error("Please select an image and ensure you're logged in");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload to Cloudinary
      const uploadToast = toast.loading("Uploading image...");
      const cloudinaryData = await uploadToCloudinary(file);
      toast.dismiss(uploadToast);

      // Save to Firestore
      const saveToast = toast.loading("Saving image data...");
      const docId = await saveImageData(
        cloudinaryData.secure_url,
        userId,
        {
          publicId: cloudinaryData.public_id,
          width: cloudinaryData.width,
          height: cloudinaryData.height,
          format: cloudinaryData.format,
          bytes: cloudinaryData.bytes,
          ...metadata,
        }
      );
      toast.dismiss(saveToast);

      // Success
      toast.success("Image uploaded successfully!");
      
      // Clear form
      setFile(null);
      setPreview(null);
      
      // Call success callback
      if (onSuccess) {
        onSuccess({
          docId,
          url: cloudinaryData.secure_url,
          cloudinaryData,
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err.message || "Failed to upload image";
      setError(errorMsg);
      toast.error(errorMsg);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* File Input */}
      <label className="relative cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {file ? file.name : "Click to select image (max " + maxSizeMB + "MB)"}
          </span>
        </div>
      </label>

      {/* Preview */}
      {preview && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full max-w-xs mx-auto">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-lg border border-gray-200 object-cover max-h-64"
            />
            <button
              onClick={handleCancel}
              disabled={loading}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {(file?.size / 1024 / 1024).toFixed(2)}MB
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {preview && (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Uploading..." : actionText}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
