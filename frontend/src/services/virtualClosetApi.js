// src/services/virtualClosetApi.js
// API service for Virtual Closet — local image upload & persistence

import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const VIRTUAL_CLOSET_ENDPOINT = `${API_BASE}/virtual-closet`;

// ─── Utility: Get Auth Token ──────────────────────────────────────────────────

const getAuthToken = async () => {
  try {
    console.log('🔐 Getting Firebase auth token...');
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('⚠️ No user logged in');
      throw new Error('User not authenticated. Please log in first.');
    }
    
    console.log('👤 User logged in:', user.email);
    const token = await user.getIdToken();
    console.log('✅ Token retrieved successfully');
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error.message);
    throw error;
  }
};

// ─── Create axios instance with auth header ───────────────────────────────────

const createAxiosInstance = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: VIRTUAL_CLOSET_ENDPOINT,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// ─── API Methods ──────────────────────────────────────────────────────────────

/**
 * Upload a new look (image) to Virtual Closet
 * @param {File} file - Image file from input
 * @param {Object} metadata - { occasion, tags }
 * @returns {Promise<Object>} - { id, occasion, image, etc. }
 */
export const uploadLook = async (file, metadata = {}) => {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    if (metadata.occasion) formData.append('occasion', metadata.occasion);
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }

    const response = await axios.post(`${VIRTUAL_CLOSET_ENDPOINT}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all saved looks from Virtual Closet
 * @param {Object} options - { limit, sort }
 * @returns {Promise<Array>} - Array of saved looks
 */
export const getVirtualCloset = async (options = {}) => {
  try {
    console.log('📡 Fetching Virtual Closet from:', VIRTUAL_CLOSET_ENDPOINT);
    const api = await createAxiosInstance();
    const { limit = 50, sort = 'newest' } = options;

    const response = await api.get('/', {
      params: { limit, sort },
    });

    console.log('📦 Response data:', response.data);
    return response.data.data.looks || [];
  } catch (error) {
    console.error('❌ Fetch error:', error);
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    }
    throw error.response?.data || error;
  }
};

/**
 * Get a single look by ID
 * @param {string} lookId - ID of the look
 * @returns {Promise<Object>} - Look details
 */
export const getLook = async (lookId) => {
  try {
    const api = await createAxiosInstance();
    const response = await api.get(`/${lookId}`);
    return response.data.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update look metadata (occasion, tags)
 * @param {string} lookId - ID of the look
 * @param {Object} updates - { occasion, tags }
 * @returns {Promise<Object>} - Updated look
 */
export const updateLook = async (lookId, updates) => {
  try {
    const api = await createAxiosInstance();
    const response = await api.put(`/${lookId}`, updates);
    return response.data.data;
  } catch (error) {
    console.error('Update error:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete a single look
 * @param {string} lookId - ID of the look
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteLook = async (lookId) => {
  try {
    const api = await createAxiosInstance();
    const response = await api.delete(`/${lookId}`);
    return response.data;
  } catch (error) {
    console.error('Delete error:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete all looks (requires confirmation)
 * @returns {Promise<Object>} - Batch deletion result
 */
export const deleteAllLooks = async () => {
  try {
    const api = await createAxiosInstance();
    const response = await api.delete('/');
    return response.data;
  } catch (error) {
    console.error('Delete error:', error);
    throw error.response?.data || error;
  }
};

// ─── Export all methods ────────────────────────────────────────────────────────

export default {
  uploadLook,
  getVirtualCloset,
  getLook,
  updateLook,
  deleteLook,
  deleteAllLooks,
};
