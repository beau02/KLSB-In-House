import axios from 'axios';
import { apiCache } from '../utils/cache';
import { requestQueue } from '../utils/requestQueue';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses with caching and ETag support
api.interceptors.response.use(
  (response) => {
    // Cache GET requests
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}`;
      // Cache for 5 minutes by default (can be customized per endpoint)
      const ttl = response.headers['x-cache-ttl'] || 300;
      apiCache.set(cacheKey, response.data, parseInt(ttl));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/timesheet/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Wrapper for GET requests with caching and deduplication
 * @param {string} url - The endpoint URL
 * @param {object} options - Additional options (cache: true/false, ttl: seconds)
 */
export const cachedGet = async (url, options = {}) => {
  const { cache = true, ttl = 300 } = options;
  const cacheKey = url;

  // Check cache first
  if (cache) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  // Use request queue to deduplicate simultaneous requests
  try {
    const response = await requestQueue.execute(cacheKey, () => api.get(url));
    return { data: response.data, fromCache: false };
  } catch (error) {
    throw error;
  }
};

/**
 * Clear API cache
 */
export const clearApiCache = () => {
  apiCache.clear();
};

/**
 * Clear specific cache entry
 */
export const clearCacheEntry = (url) => {
  apiCache.remove(url);
};

export default api;
