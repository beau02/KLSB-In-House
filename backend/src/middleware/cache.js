/**
 * Redis Cache Middleware for Express
 * Caches GET request responses to reduce database queries
 */

const Redis = require('ioredis');

class CacheManager {
  constructor(options = {}) {
    const {
      host = process.env.REDIS_HOST || 'localhost',
      port = process.env.REDIS_PORT || 6379,
      password = process.env.REDIS_PASSWORD || null,
      db = process.env.REDIS_DB || 0,
      enabled = process.env.ENABLE_REDIS !== 'false'
    } = options;

    this.enabled = enabled;
    this.defaultTTL = 300; // 5 minutes default

    if (this.enabled) {
      try {
        this.redis = new Redis({
          host,
          port,
          password: password || undefined,
          db,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          enableOfflineQueue: false
        });

        this.redis.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
          console.log('Redis connected successfully');
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.enabled = false;
      }
    }
  }

  /**
   * Get cached value
   */
  async get(key) {
    if (!this.enabled || !this.redis) return null;
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache value with TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled || !this.redis) return;
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key) {
    if (!this.enabled || !this.redis) return;
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear cache by pattern
   */
  async deletePattern(pattern) {
    if (!this.enabled || !this.redis) return;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    if (!this.enabled || !this.redis) return;
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected() {
    return this.enabled && this.redis && this.redis.status === 'ready';
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Create singleton instance
let cacheInstance = null;

const initCache = (options = {}) => {
  if (!cacheInstance) {
    cacheInstance = new CacheManager(options);
  }
  return cacheInstance;
};

const getCache = () => {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
};

/**
 * Middleware to cache GET requests
 * Usage: app.use(cacheMiddleware({ ttl: 300 }))
 */
const cacheMiddleware = (options = {}) => {
  const cache = getCache();
  const defaultTTL = options.ttl || 300;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for certain endpoints
    const noCache = ['/health', '/api/auth/login', '/api/auth/logout'];
    if (noCache.some(path => req.path.includes(path))) {
      return next();
    }

    const cacheKey = `route:${req.originalUrl}`;

    try {
      // Check if cached
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        res.set('X-Cache', 'MISS');
        
        // Cache the response
        const ttl = res.get('X-Cache-TTL') || defaultTTL;
        cache.set(cacheKey, data, parseInt(ttl));

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = {
  CacheManager,
  initCache,
  getCache,
  cacheMiddleware
};
