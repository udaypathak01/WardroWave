const { getDB } = require('../config/firebase');
const COLLECTIONS = require('../config/collections');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const docToObj = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
  };
};

// ─── POST /api/virtual-closet/upload ───────────────────────────────────────────

const uploadLook = asyncHandler(async (req, res) => {
  const userId = req.firebaseUser.uid;
  const db = getDB();

  // ✅ Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided.',
    });
  }

  const { occasion = 'New Upload', tags = ['Your Style', '✨'] } = req.body;

  try {
    // 🎯 Upload to Cloudinary
    console.log(`📤 Starting upload for user ${userId}`);
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'wardrowave/virtual-closet'
    );
    console.log(`✅ Cloudinary upload complete:`, cloudinaryResult.public_id);

    // 💾 Save metadata to Firestore
    const newLook = {
      userId,
      occasion,
      tags: Array.isArray(tags) ? tags : [tags],
      image: {
        secure_url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
      },
      isAIMatched: Math.random() > 0.3, // Random AI badge
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`📝 Preparing Firestore write for collection: users/${userId}/virtual_closet`);
    console.log(`📋 Document data:`, JSON.stringify(newLook, null, 2));

    // Add to Firestore — store under user's subcollection
    const docRef = await db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.VIRTUAL_CLOSET)
      .add(newLook);

    console.log(`✅ Firestore document created with ID:`, docRef.id);
    console.log(`✅ New look uploaded by ${userId}:`, docRef.id);

    res.status(201).json({
      success: true,
      message: 'Look uploaded successfully!',
      data: {
        id: docRef.id,
        ...newLook,
      },
    });
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    console.error('📍 Full error:', error);
    console.error('🔍 Stack trace:', error.stack);

    // Distinguish between different error types
    if (error.message.includes('CLOUDINARY') || error.message.includes('credentials')) {
      return res.status(503).json({
        success: false,
        message: 'Server configuration error.',
        details: 'Cloudinary service is not properly configured. Please contact support.',
      });
    }

    // Firestore permission errors
    if (error.code === 'permission-denied') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied.',
        details: 'You do not have permission to create documents in your virtual closet. Ensure you are logged in.',
      });
    }

    // Firestore not found errors (user doc doesn't exist)
    if (error.code === 'not-found') {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        details: 'Your user profile does not exist. Please complete your profile first.',
      });
    }

    // Handle general upload/Firestore errors
    res.status(500).json({
      success: false,
      message: 'Failed to upload image.',
      details: error.message,
    });
  }
});

// ─── GET /api/virtual-closet ───────────────────────────────────────────────────

const getVirtualCloset = asyncHandler(async (req, res) => {
  const userId = req.firebaseUser.uid;
  const db = getDB();
  const { limit = 50, sort = 'newest' } = req.query;

  try {
    // Fetch all looks from user's subcollection
    let query = db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.VIRTUAL_CLOSET);

    // Apply sorting
    if (sort === 'newest') {
      query = query.orderBy('createdAt', 'desc');
    } else if (sort === 'oldest') {
      query = query.orderBy('createdAt', 'asc');
    }

    // Apply limit
    query = query.limit(Math.min(Math.max(1, parseInt(limit)), 100));

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: 'No saved looks yet.',
        data: {
          looks: [],
          total: 0,
        },
      });
    }

    const looks = snapshot.docs.map(docToObj);

    res.status(200).json({
      success: true,
      data: {
        looks,
        total: looks.length,
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch virtual closet.',
      error: error.message,
    });
  }
});

// ─── GET /api/virtual-closet/:lookId ────────────────────────────────────────────

const getLook = asyncHandler(async (req, res) => {
  const userId = req.firebaseUser.uid;
  const { lookId } = req.params;
  const db = getDB();

  try {
    const docSnapshot = await db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.VIRTUAL_CLOSET)
      .doc(lookId)
      .get();

    if (!docSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: 'Look not found.',
      });
    }

    const look = docToObj(docSnapshot);

    res.status(200).json({
      success: true,
      data: look,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch look.',
      error: error.message,
    });
  }
});

// ─── PUT /api/virtual-closet/:lookId ─────────────────────────────────────────────

const updateLook = asyncHandler(async (req, res) => {
  const userId = req.firebaseUser.uid;
  const { lookId } = req.params;
  const { occasion, tags } = req.body;
  const db = getDB();

  // Validate input
  if (!occasion && !tags) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (occasion or tags) must be provided.',
    });
  }

  try {
    const lookRef = db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.VIRTUAL_CLOSET)
      .doc(lookId);

    const lookSnapshot = await lookRef.get();
    if (!lookSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: 'Look not found.',
      });
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (occasion) updateData.occasion = occasion;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : [tags];

    await lookRef.update(updateData);

    const updatedDoc = await lookRef.get();
    const updatedLook = docToObj(updatedDoc);

    res.status(200).json({
      success: true,
      message: 'Look updated successfully!',
      data: updatedLook,
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update look.',
      error: error.message,
    });
  }
});

// ─── DELETE /api/virtual-closet/:lookId ──────────────────────────────────────────

const deleteLook = asyncHandler(async (req, res) => {
  const userId = req.firebaseUser.uid;
  const { lookId } = req.params;
  const db = getDB();

  try {
    const lookRef = db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.VIRTUAL_CLOSET)
      .doc(lookId);

    const lookSnapshot = await lookRef.get();
    if (!lookSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: 'Look not found.',
      });
    }

    const lookData = lookSnapshot.data();
    const publicId = lookData.image?.public_id;

    // 🗑️ Delete from Cloudinary
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        console.warn('Cloudinary deletion warning:', cloudinaryError);
        // Don't fail the request if Cloudinary deletion fails
      }
    }

    // 🗑️ Delete from Firestore
    await lookRef.delete();

    res.status(200).json({
      success: true,
      message: 'Look deleted successfully!',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete look.',
      error: error.message,
    });
  }
});

// ─── DELETE /api/virtual-closet (Delete all) ──────────────────────────────────────

const deleteAllLooks = asyncHandler(async (req, res) => {
  const userId = req.firebaseUser.uid;
  const db = getDB();

  try {
    const snapshot = await db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.VIRTUAL_CLOSET)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: 'No looks to delete.',
        deletedCount: 0,
      });
    }

    // Delete from Cloudinary in parallel
    const deletionPromises = snapshot.docs.map(async (doc) => {
      const publicId = doc.data().image?.public_id;
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (err) {
          console.warn(`Failed to delete ${publicId}:`, err);
        }
      }
      return doc.ref.delete();
    });

    await Promise.all(deletionPromises);

    res.status(200).json({
      success: true,
      message: 'All looks deleted successfully!',
      deletedCount: snapshot.docs.length,
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete looks.',
      error: error.message,
    });
  }
});

module.exports = {
  uploadLook,
  getVirtualCloset,
  getLook,
  updateLook,
  deleteLook,
  deleteAllLooks,
};
