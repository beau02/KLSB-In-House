# Web App Performance Optimization Guide

## Overview
This document outlines the optimizations implemented to improve application performance and reduce lag.

## Implemented Optimizations

### 1. Client-Side Caching (Frontend)

#### Location: `frontend/src/utils/cache.js`
- **LocalStorage Caching**: Caches API responses with TTL (Time-To-Live)
- **Cache Expiration**: Automatic cleanup of expired entries
- Default TTL: 5 minutes (configurable per endpoint)

**Usage:**
```javascript
import { apiCache } from '../utils/cache';

// Set cache
apiCache.set('key', data, 300); // 300 seconds

// Get cache
const cachedData = apiCache.get('key');

// Check if exists
if (apiCache.has('key')) { ... }

// Clear specific entry
apiCache.remove('key');

// Clear all
apiCache.clear();
```

### 2. Request Deduplication (Frontend)

#### Location: `frontend/src/utils/requestQueue.js`
- **Prevents Duplicate Requests**: Avoids multiple simultaneous requests for the same data
- **Memory Efficient**: Requests are tracked and cleared after completion
- **Error Handling**: Failures are properly handled and cache is cleaned up

**Usage:**
```javascript
import { requestQueue } from '../utils/requestQueue';

// Execute request with deduplication
const result = await requestQueue.execute('unique-key', async () => {
  return await api.get('/endpoint');
});
```

### 3. Enhanced API Service

#### Location: `frontend/src/services/api.js`
- **Response Caching**: GET requests are automatically cached
- **ETag Support**: Ready for HTTP caching with ETags
- **Custom TTL**: Per-endpoint cache duration via `x-cache-ttl` header

**Usage:**
```javascript
import { cachedGet, clearApiCache } from '../services/api';

// Cached GET request
const { data, fromCache } = await cachedGet('/api/timesheets');

// Clear cache when needed
clearApiCache();

// Clear specific entry
import { clearCacheEntry } from '../services/api';
clearCacheEntry('/api/timesheets');
```

### 4. Server-Side Response Caching (Backend)

#### Location: `backend/src/middleware/cache.js`
- **Redis Caching**: Caches API responses at the server level
- **Automatic Serialization**: JSON handling is built-in
- **TTL Management**: Configurable per endpoint (default: 5 minutes)
- **Graceful Degradation**: Works without Redis installed

**Features:**
- ✅ Transparent caching for GET requests
- ✅ Automatic cache invalidation
- ✅ Pattern-based cache clearing
- ✅ Connection pooling & retry logic

### 5. Gzip Compression

#### Enabled in: `backend/src/server.js`
- Reduces response size by ~70% for typical JSON responses
- Applied to all responses automatically

### 6. Bundle Optimization (Frontend)

#### Location: `frontend/vite.config.js`
- **Code Splitting**: Separate chunks for vendor, MUI, and form libraries
- **Tree Shaking**: Removes unused code during build
- **Minification**: Terser minification with console removal
- **Dependency Pre-bundling**: Faster module resolution

**Chunks Created:**
- `vendor.js`: React, React-DOM, React-Router
- `mui.js`: Material-UI and dependencies
- `forms.js`: Formik and Yup validation

### 7. Database Query Caching

#### Location: `backend/src/utils/queryCache.js`
- Wraps expensive Mongoose queries with caching
- Automatic cache invalidation per model
- Reduces database load

**Usage:**
```javascript
const QueryCache = require('../utils/queryCache');
const queryCache = new QueryCache();

// Wrap a query
const result = await queryCache.findCached('User', async () => {
  return await User.find({ status: 'active' });
}, { ttl: 600 }); // 10 minutes

// Invalidate model cache
await queryCache.invalidateModel('User');
```

## Performance Metrics

### Expected Improvements:
- **First Load**: 30-40% faster due to bundle splitting
- **Subsequent Loads**: 70-80% faster with caching (zero API calls)
- **API Response Time**: Reduced by 50-60% for cached endpoints
- **Network Bandwidth**: Reduced by 70% with compression

### Monitoring:
Add to browser dev tools network tab:
- Look for `X-Cache: HIT` header = served from cache
- Look for `X-Cache: MISS` header = fresh from server

## Configuration

### Redis Configuration (Optional)
Set environment variables in `.env`:
```
ENABLE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=your_password  # Optional
```

Without Redis, in-memory caching is used (still performant).

### Vite Dev Server
For local development, caching can be disabled in:
- `frontend/src/services/api.js`: Remove cache logic in dev if needed

## Cache Invalidation Strategy

### Automatic Invalidation:
- Cache automatically expires based on TTL
- Expired entries are cleaned up

### Manual Invalidation:
```javascript
// Backend
const { getCache } = require('./middleware/cache');
const cache = getCache();

// Clear specific endpoint
await cache.delete('route:/api/timesheets');

// Clear pattern
await cache.deletePattern('route:/api/timesheets/*');

// Full flush
await cache.flush();

// Frontend
import { clearCacheEntry, clearApiCache } from '../services/api';
clearCacheEntry('/api/timesheets');  // Specific
clearApiCache();  // All
```

### On Data Updates:
When creating, updating, or deleting data, invalidate related caches:
```javascript
// After updating a timesheet
const { getCache } = require('../middleware/cache');
await getCache().deletePattern('route:/api/timesheets*');
await getCache().deletePattern('route:/api/stats*');
```

## Best Practices

1. **Update Cache on Data Changes**: Invalidate cache when data is modified
2. **Set Appropriate TTLs**: Short for user data (5 min), longer for static data (30 min)
3. **Monitor Redis**: Check Redis memory usage if using Redis
4. **Test Cache Hit Rates**: Use browser dev tools to verify caching is working
5. **Log Cache Operations**: Enable logging in cache middleware for debugging

## Troubleshooting

### Cache Not Working:
1. Check if Redis is running (if enabled)
2. Verify `X-Cache` header in network tab
3. Check browser console for errors

### High Memory Usage:
1. Reduce TTL values
2. Implement cache size limits
3. Use Redis instead of in-memory caching

### Stale Data:
1. Invalidate cache after updates
2. Reduce TTL for rapidly changing data
3. Implement manual refresh buttons

## Future Optimizations

- [ ] Implement Service Worker for offline support
- [ ] Add IndexedDB for larger cached datasets
- [ ] Implement incremental static regeneration (ISR)
- [ ] Add WebP image format support
- [ ] Implement database query optimization with indexes
- [ ] Add analytics for cache hit/miss rates
