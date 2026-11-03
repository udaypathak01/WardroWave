import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, X } from "lucide-react";
import { useUploadWardrobeImageMutation } from "../../lib/api/hooks";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const ImageUpload = ({ onSuccess, className = "", actionText = "Upload Image" }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const uploadMutation = useUploadWardrobeImageMutation();
  const loading = uploadMutation.isPending;

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.has(selectedFile.type)) {
      const message = "Choose a JPEG, PNG, or WebP image.";
      setError(message);
      setFile(null);
      setPreview(null);
      toast.error(message);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      const message = "Image must be 5 MB or smaller.";
      setError(message);
      setFile(null);
      setPreview(null);
      toast.error(message);
      return;
    }

    setError(null);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setError(null);
      setProgress(0);
      const result = await uploadMutation.mutateAsync({
        file,
        onProgress: setProgress,
      });
      setFile(null);
      setPreview(null);
      setProgress(0);
      toast.success("Image uploaded successfully.");
      onSuccess?.(result.data);
    } catch (uploadError) {
      const message = uploadError instanceof Error
        ? uploadError.message
        : "Failed to upload image.";
      setError(message);
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    uploadMutation.reset();
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <label className="relative cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {file ? file.name : "Click to select an image (max 5 MB)"}
          </span>
        </div>
      </label>

      {preview && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full max-w-xs mx-auto">
            <img
              src={preview}
              alt="Selected image preview"
              className="w-full h-auto rounded-lg border border-gray-200 object-cover max-h-64"
            />
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              aria-label="Remove selected image"
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="h-2 overflow-hidden rounded bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">Uploading: {progress}%</p>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {preview && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !file}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Uploading..." : actionText}
          </button>
          <button
            type="button"
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
