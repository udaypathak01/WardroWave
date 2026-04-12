// src/services/firestore.js
// Firestore database operations for image metadata

import {
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

const IMAGES_COLLECTION = import.meta.env.VITE_FIRESTORE_IMAGES_COLLECTION || "images";

/**
 * Save image data to Firestore
 * @param {string} imageUrl - Cloudinary secure URL
 * @param {string} userId - User ID
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<string>} - Document ID
 */
export const saveImageData = async (imageUrl, userId, metadata = {}) => {
  try {
    const imageRef = await addDoc(collection(db, IMAGES_COLLECTION), {
      imageUrl,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...metadata,
    });
    return imageRef.id;
  } catch (error) {
    console.error("Error saving image data to Firestore:", error);
    throw new Error(`Failed to save image data: ${error.message}`);
  }
};

/**
 * Get all images for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of image documents
 */
export const getUserImages = async (userId) => {
  try {
    const q = query(
      collection(db, IMAGES_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching user images:", error);
    throw new Error(`Failed to fetch images: ${error.message}`);
  }
};

/**
 * Get all images (for admin/gallery)
 * @returns {Promise<Array>} - Array of image documents
 */
export const getAllImages = async () => {
  try {
    const q = query(
      collection(db, IMAGES_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all images:", error);
    throw new Error(`Failed to fetch images: ${error.message}`);
  }
};

/**
 * Delete image document from Firestore
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteImageData = async (docId) => {
  try {
    await deleteDoc(doc(db, IMAGES_COLLECTION, docId));
  } catch (error) {
    console.error("Error deleting image data:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Update image metadata
 * @param {string} docId - Document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateImageData = async (docId, updates) => {
  try {
    await updateDoc(doc(db, IMAGES_COLLECTION, docId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating image data:", error);
    throw new Error(`Failed to update image: ${error.message}`);
  }
};
