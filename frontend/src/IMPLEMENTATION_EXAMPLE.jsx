/**
 * EXAMPLE: How to integrate image upload in your pages
 * 
 * This is a reference implementation showing three different usage patterns.
 * Choose the one that fits your needs best.
 */

// ============================================================
// PATTERN 1: Simple component-based (Recommended for most cases)
// ============================================================
import React from "react";
import ImageUpload from "./components/common/ImageUpload";
import ImageGallery from "./components/common/ImageGallery";
import { useAuth } from "./context api/AuthContext";

function ProfilePhotoUploadPage() {
  const { user } = useAuth();
  const [refreshGallery, setRefreshGallery] = React.useState(0);

  if (!user) return <div>Please log in</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Profile Photo</h2>

      {/* Upload Component */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <ImageUpload
          userId={user.uid}
          onSuccess={() => {
            // Refresh gallery after successful upload
            setRefreshGallery((prev) => prev + 1);
          }}
          maxSizeMB={5}
          actionText="Upload Photo"
          metadata={{ uploadType: "profile" }}
        />
      </div>

      {/* Gallery Component */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Photos</h3>
        <ImageGallery 
          userId={user.uid}
          refreshTrigger={refreshGallery}
          onImageSelect={(image) => {
            console.log("Selected for profile:", image.imageUrl);
            // Update profile with selected image
          }}
        />
      </div>
    </div>
  );
}

export default ProfilePhotoUploadPage;

// ============================================================
// PATTERN 2: Hook-based (For more control)
// ============================================================
import { useImageUpload } from "./hooks/useImageUpload";

function ProductImageUploadPage() {
  const { user } = useAuth();
  const { file, preview, loading, error, upload, validateAndSetFile } =
    useImageUpload(user.uid, { uploadType: "product" });

  const handleFileChange = (e) => {
    const isValid = validateAndSetFile(e.target.files[0]);
    if (!isValid) console.log("Validation failed");
  };

  const handleUpload = async () => {
    try {
      const result = await upload();
      console.log("✅ Uploaded:", result.url);
      // Do something with the uploaded image
    } catch (error) {
      console.error("❌ Upload failed:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add Product Image</h2>

      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="mb-4"
      />

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {preview && (
        <div className="mb-4">
          <img src={preview} alt="preview" className="max-w-xs rounded" />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}

// ============================================================
// PATTERN 3: Direct service usage (For advanced control)
// ============================================================
import { uploadToCloudinary } from "./services/cloudinary";
import { saveImageData, getUserImages } from "./services/firestore";

async function advancedUploadExample(file, userId) {
  try {
    // Step 1: Upload to Cloudinary
    console.log("📤 Uploading to Cloudinary...");
    const cloudinaryData = await uploadToCloudinary(file);
    console.log("✅ Cloudinary URL:", cloudinaryData.secure_url);

    // Step 2: Save metadata to Firestore
    console.log("💾 Saving to Firestore...");
    const docId = await saveImageData(
      cloudinaryData.secure_url,
      userId,
      {
        uploadType: "custom",
        category: "fashion",
        tags: ["trending", "new"],
      }
    );
    console.log("✅ Firestore Document ID:", docId);

    // Step 3: Fetch all user images
    console.log("📖 Fetching user images...");
    const userImages = await getUserImages(userId);
    console.log("✅ Found", userImages.length, "images");

    return {
      url: cloudinaryData.secure_url,
      docId,
      allImages: userImages,
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================================
// INTEGRATION TIPS
// ============================================================

/*
1. Where to use each method:
   - Pattern 1 (Component): Profile photos, user avatars, simple uploads
   - Pattern 2 (Hook): Product images, gallery, custom UI
   - Pattern 3 (Services): Batch uploads, complex workflows

2. Before you start:
   ✓ Create Cloudinary account
   ✓ Create unsigned upload preset
   ✓ Add VITE_CLOUDINARY_CLOUD_NAME to .env
   ✓ Add VITE_CLOUDINARY_UPLOAD_PRESET to .env
   ✓ Ensure user is authenticated (user.uid available)

3. File validation:
   ✓ Max 2MB by default (configurable: maxSizeMB prop)
   ✓ Only image files allowed
   ✓ Automatically validated before upload

4. Firestore structure:
   {
     imageUrl: "https://res.cloudinary.com/...",
     userId: "user123",
     createdAt: timestamp,
     updatedAt: timestamp,
     publicId: "wardrowave/abc123",
     width: 1200,
     height: 800,
     format: "jpg",
     bytes: 102400,
     ... (your custom metadata)
   }

5. Error handling:
   - Check .env variables are set
   - Ensure Firestore rules allow write
   - Verify unsigned upload preset is enabled in Cloudinary
   - Check network tab for API responses

*/
