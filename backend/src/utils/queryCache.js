/**
 * Database Query Caching Utility
 * Wraps Mongoose queries with Redis caching for frequently accessed data
 */

// Cache disabled for shared hosting
const getCache = () => ({
  get: async () => null,
  set: async () => {},
  deletePattern: async () => {}
});

class QueryCache {
  constructor(cache = null) {
    this.cache = cache || getCache();
    this.defaultTTL = 600; // 10 minutes for DB queries
  }

  /**
   * Generate cache key for a query
   */
  generateKey(modelName, query, options = {}) {
    const queryStr = JSON.stringify(query).replace(/\s/g, '');
    const sortStr = options.sort ? JSON.stringify(options.sort) : '';
    return `db:${modelName}:${queryStr}:${sortStr}`;
  }

  /**
   * Wrap a Mongoose query with caching
   * @param {string} modelName - Name of the model (e.g., 'User', 'Timesheet')
   * @param {function} queryFn - Function that returns a Mongoose query
   * @param {object} options - { ttl, cacheable }
   */
  async findCached(modelName, queryFn, options = {}) {
    const { ttl = this.defaultTTL, cacheable = true } = options;

    if (!cacheable) {
      return queryFn();
    }

    // For complex queries, use function toString as part of key
    const queryKey = `db:${modelName}:${queryFn.toString().substring(0, 100)}:${Date.now() % 1000}`;

    try {
      // Try cache first
      const cached = await this.cache.get(queryKey);
      if (cached) {
        return cached;
      }

      // Execute query
      const result = await queryFn();

      // Cache the result
      if (result) {
        await this.cache.set(queryKey, result, ttl);
      }

      return result;
    } catch (error) {
      console.error('Query cache error:', error);
      // Fallback to direct query
      return queryFn();
    }
  }

  /**
   * Invalidate cache for a model
   */
  async invalidateModel(modelName) {
    await this.cache.deletePattern(`db:${modelName}:*`);
  }

  /**
   * Invalidate all query cache
   */
  async invalidateAll() {
    await this.cache.deletePattern('db:*');
  }
}

module.exports = QueryCache;
