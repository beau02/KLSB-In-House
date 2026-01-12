/**
 * Client-side cache utility with TTL (Time-To-Live) support
 * Stores data in localStorage with expiration timestamps
 */

class CacheManager {
  constructor(prefix = 'cache_') {
    this.prefix = prefix;
  }

  /**
   * Set cache with TTL in seconds
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    try {
      const cacheKey = `${this.prefix}${key}`;
      const expiresAt = Date.now() + ttlSeconds * 1000;
      const cacheData = {
        value,
        expiresAt,
        createdAt: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  /**
   * Get cached value if not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { value, expiresAt } = JSON.parse(cached);
      
      // Check if cache expired
      if (Date.now() > expiresAt) {
        this.remove(key);
        return null;
      }
      
      return value;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove cache entry
   */
  remove(key) {
    try {
      const cacheKey = `${this.prefix}${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Cache remove failed:', error);
    }
  }

  /**
   * Clear all cached entries with this prefix
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key));
            if (Date.now() > cached.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Cache clearExpired failed:', error);
    }
  }
}

// Export singleton instances for different cache types
export const apiCache = new CacheManager('api_');
export const uiCache = new CacheManager('ui_');
export default CacheManager;
