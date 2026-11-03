import toast from "react-hot-toast";
import { Trash2, Calendar, Loader } from "lucide-react";
import {
  useRemoveWardrobeImageMutation,
  useWardrobeQuery,
} from "../../lib/api/hooks";

const ImageGallery = ({ onImageSelect }) => {
  const imagesQuery = useWardrobeQuery();
  const deleteMutation = useRemoveWardrobeImageMutation();
  const images = imagesQuery.data?.data ?? [];

  const handleDelete = (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    deleteMutation.mutate(imageId, {
      onSuccess: () => toast.success("Image deleted successfully."),
      onError: (error) => toast.error(error.message || "Failed to delete image."),
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
  };

  if (imagesQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
        <span className="sr-only">Loading wardrobe images</span>
      </div>
    );
  }

  if (imagesQuery.isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
        <p className="text-red-700 text-sm">
          {imagesQuery.error.message || "Failed to load your wardrobe."}
        </p>
        <button
          type="button"
          onClick={() => imagesQuery.refetch()}
          className="mt-2 text-sm font-medium text-red-800 underline"
        >
          Try again
        </button>
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
      {images.map((image) => {
        const deleting = deleteMutation.isPending && deleteMutation.variables === image._id;
        return (
          <div
            key={image._id}
            className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <button
              type="button"
              onClick={() => onImageSelect?.(image)}
              aria-label="Select wardrobe image"
              className="w-full aspect-square overflow-hidden bg-gray-100 cursor-pointer"
            >
              <img
                src={image.url}
                alt="Wardrobe item"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>

            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-3">
              <div className="w-full bg-white/95 backdrop-blur-sm rounded-lg p-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(image.createdAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(image._id)}
                  disabled={deleting || deleteMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {image.bytes && (
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {(image.bytes / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ImageGallery;
