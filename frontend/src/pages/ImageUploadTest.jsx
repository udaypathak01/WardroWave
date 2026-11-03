import ImageUpload from "../components/common/ImageUpload";
import ImageGallery from "../components/common/ImageGallery";
import { useAuth } from "../context api/AuthContext";
import { ArrowLeft, Images, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ImageUploadTest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p className="text-gray-600 mb-6">Sign in to manage your wardrobe images.</p>
          <button
            type="button"
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
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
            <p className="text-gray-600 mt-1">
              Save outfit inspiration and wardrobe images for your account.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Add an image</h2>
            <ImageUpload actionText="Add to Wardrobe" />
            <p className="mt-4 text-sm text-gray-500">
              JPEG, PNG, or WebP images up to 5 MB.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Images className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">Your collection</h2>
              </div>
              <p className="text-sm text-gray-600">
                Your account controls the collection. Anyone with an image URL may view that image.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-700" />
                <h2 className="font-bold text-green-900">Server-validated uploads</h2>
              </div>
              <p className="text-sm text-green-800">
                Uploads are validated by the server before being saved.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Your images</h2>
          <ImageGallery />
        </section>
      </div>
    </div>
  );
}

export default ImageUploadTest;
