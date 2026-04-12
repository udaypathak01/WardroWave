// src/components/common/ImageGallery.jsx
// Display and manage uploaded images

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getUserImages, deleteImageData } from "../../services/firestore";
import { Trash2, Calendar, Loader } from "lucide-react";

const ImageGallery = ({ userId, onImageSelect, refreshTrigger = 0 }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    fetchImages();
  }, [userId, refreshTrigger]);

  const fetchImages = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userImages = await getUserImages(userId);
      setImages(userImages);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError(err.message);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setDeleting((prev) => ({ ...prev, [docId]: true }));
      await deleteImageData(docId);
      setImages((prev) => prev.filter((img) => img.id !== docId));
      toast.success("Image deleted successfully");
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.error("Failed to delete image");
    } finally {
      setDeleting((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
        >
          {/* Image */}
          <button
            onClick={() => {
              if (onImageSelect) onImageSelect(image);
            }}
            className="w-full aspect-square overflow-hidden bg-gray-100 cursor-pointer"
          >
            <img
              src={image.imageUrl}
              alt="Uploaded"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-3">
            <div className="w-full bg-white/95 backdrop-blur-sm rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(image.createdAt)}</span>
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.id, image.imageUrl);
                }}
                disabled={deleting[image.id]}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                {deleting[image.id] ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* Image Size Badge */}
          {image.bytes && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {(image.bytes / 1024 / 1024).toFixed(2)}MB
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;
