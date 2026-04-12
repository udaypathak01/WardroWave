// src/pages/ImageUploadTest.jsx
// Test page for Cloudinary image upload feature

import React, { useState } from "react";
import ImageUpload from "../components/common/ImageUpload";
import ImageGallery from "../components/common/ImageGallery";
import { useAuth } from "../context api/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ImageUploadTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshGallery, setRefreshGallery] = useState(0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to upload images</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Image Upload Test</h1>
            <p className="text-gray-600 mt-1">Logged in as: <span className="font-medium">{user.displayName || user.email}</span></p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Upload Image</h2>
            <ImageUpload
              userId={user.uid}
              onSuccess={() => {
                setRefreshGallery((prev) => prev + 1);
              }}
              maxSizeMB={2}
              actionText="Upload Image"
              metadata={{
                uploadType: "test",
                testDate: new Date().toISOString(),
              }}
            />
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Test Info</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Max file size: 2MB</li>
                <li>✓ Allowed formats: JPG, PNG, GIF, WebP</li>
                <li>✓ Images are uploaded to Cloudinary</li>
                <li>✓ Metadata saved to Firestore</li>
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">User Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">User ID:</span>
                  <p className="font-mono text-xs text-gray-500 break-all">{user.uid}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Cloudinary Config</h3>
              <div className="space-y-2 text-sm font-mono text-gray-600">
                <div>
                  <span className="text-gray-400">Cloud Name:</span>
                  <p className="text-gray-900">doiyd6zkx</p>
                </div>
                <div>
                  <span className="text-gray-400">Upload Preset:</span>
                  <p className="text-gray-900">wadrowave</p>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-900 mb-2">✅ Ready to Use</h3>
              <p className="text-sm text-green-800 mb-3">All configuration is complete! You can now:</p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Upload images via this page</li>
                <li>View your uploads below</li>
                <li>Use components in other pages</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Your Uploads</h2>
          <ImageGallery
            userId={user.uid}
            refreshTrigger={refreshGallery}
            onImageSelect={(image) => {
              console.log("Selected image:", image);
            }}
          />
        </div>

        {/* Integration Guide */}
        <div className="mt-12 bg-amber-50 p-8 rounded-lg border border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 mb-4">📚 How to Use in Other Pages</h3>
          <div className="bg-white p-4 rounded border border-amber-100 font-mono text-sm overflow-x-auto mb-4">
            {`import ImageUpload from "./components/common/ImageUpload";
import { useAuth } from "./context api/AuthContext";

function MyPage() {
  const { user } = useAuth();

  return (
    <ImageUpload
      userId={user.uid}
      onSuccess={(data) => console.log("Uploaded:", data.url)}
      maxSizeMB={2}
      actionText="Upload Photo"
    />
  );
}`}
          </div>
          <p className="text-sm text-amber-800">
            See <code className="bg-white px-2 py-1 rounded">src/CLOUDINARY_SETUP.md</code> for more examples.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImageUploadTest;
