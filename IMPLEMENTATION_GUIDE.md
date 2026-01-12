# Quick Implementation Guide - Using Cache Features

## For Frontend Developers

### 1. Use Cached API Calls in Components

**Before (No Caching):**
```javascript
const DashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/timesheets')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);
  
  return <div>{data?.length} timesheets</div>;
};
```

**After (With Caching):**
```javascript
import { cachedGet, clearCacheEntry } from '../services/api';

const DashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Automatically caches for 5 minutes
    cachedGet('/api/timesheets')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleRefresh = () => {
    // Clear cache and fetch fresh data
    clearCacheEntry('/api/timesheets');
    cachedGet('/api/timesheets')
      .then(res => setData(res.data));
  };
  
  return (
    <div>
      {data?.length} timesheets
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
};
```

### 2. Prevent Duplicate Requests

```javascript
import { requestQueue } from '../utils/requestQueue';

const MyComponent = () => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    // Even if called multiple times, only one request is made
    const result = await requestQueue.execute('unique-key', async () => {
      return await cachedGet('/api/timesheets');
    });
    setData(result.data);
  };

  return <button onClick={fetchData}>Load Data</button>;
};
```

### 3. Implement Lazy Loading for Pages

```javascript
import { lazyLoad } from '../utils/optimization';

// Before - All pages loaded upfront
import { DashboardPage } from './pages/DashboardPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { ReportsPage } from './pages/ReportsPage';

// After - Pages loaded on demand
const DashboardPage = lazyLoad(() => 
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);

const TimesheetsPage = lazyLoad(() => 
  import('./pages/TimesheetsPage').then(m => ({ default: m.TimesheetsPage }))
);

const ReportsPage = lazyLoad(() => 
  import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage }))
);

// In routes:
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/timesheets" element={<TimesheetsPage />} />
<Route path="/reports" element={<ReportsPage />} />
```

### 4. Use Debounced Search

```javascript
import { useDebouncedState } from '../utils/optimization';

const SearchUsers = () => {
  const [debouncedValue, setSearchValue, currentValue] = useDebouncedState('', 500);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (debouncedValue) {
      // This only runs after 500ms of no typing
      cachedGet(`/api/users?search=${debouncedValue}`)
        .then(res => setResults(res.data));
    }
  }, [debouncedValue]);

  return (
    <div>
      <input 
        value={currentValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search users..."
      />
      {results.map(user => <div key={user.id}>{user.name}</div>)}
    </div>
  );
};
```

### 5. Memoize Components

```javascript
import React from 'react';

// Prevent re-renders unless props change
const UserCard = React.memo(({ user }) => (
  <div>
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
), (prevProps, nextProps) => {
  // Custom comparison - return true if props are equal
  return prevProps.user.id === nextProps.user.id;
});

export default UserCard;
```

---

## For Backend Developers

### 1. Invalidate Cache After Creating/Updating Data

**In timesheetController.js:**
```javascript
const { invalidateTimesheetCache } = require('../utils/cacheInvalidation');

// After creating a timesheet
exports.createTimesheet = async (req, res) => {
  try {
    const timesheet = new Timesheet(req.body);
    await timesheet.save();
    
    // Invalidate related caches
    await invalidateTimesheetCache();
    
    res.status(201).json(timesheet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// After updating a timesheet
exports.updateTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    // Invalidate related caches
    await invalidateTimesheetCache();
    
    res.json(timesheet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

### 2. Use Query Caching for Expensive Queries

```javascript
const QueryCache = require('../utils/queryCache');
const queryCache = new QueryCache();

exports.getDashboard = async (req, res) => {
  try {
    // Cache for 10 minutes
    const stats = await queryCache.findCached('Dashboard', async () => {
      return await Promise.all([
        Timesheet.countDocuments({ status: 'submitted' }),
        Timesheet.countDocuments({ status: 'approved' }),
        User.countDocuments()
      ]);
    }, { ttl: 600 });

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. Set Custom Cache TTL Per Endpoint

```javascript
// Override default cache TTL for specific endpoint
app.get('/api/static-data', (req, res) => {
  const data = getStaticData();
  
  // Cache this response for 30 minutes instead of default 5 minutes
  res.set('X-Cache-TTL', '1800');
  res.json(data);
});

// Short cache for frequently changing data
app.get('/api/live-updates', (req, res) => {
  const data = getLiveData();
  
  // Cache only for 1 minute
  res.set('X-Cache-TTL', '60');
  res.json(data);
});
```

### 4. Redis Connection (Optional Setup)

**.env file:**
```
ENABLE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

Once Redis is running and configured, caching works automatically!

### 5. Clear Cache for Specific Endpoints

```javascript
const { invalidateRoute } = require('../utils/cacheInvalidation');

// After bulk update
await invalidateRoute('/api/timesheets');
await invalidateRoute('/api/stats');

// Or use pattern-based invalidation
const { getCache } = require('./middleware/cache');
const cache = getCache();
await cache.deletePattern('route:/api/timesheets*');
```

---

## Monitoring Cache Performance

### Browser Dev Tools

1. Open **Network** tab
2. Look for `X-Cache` response header:
   - `X-Cache: HIT` = Served from cache ✅ (Fast!)
   - `X-Cache: MISS` = Fresh from server (First load)

### Server Logs

Enable cache logging (optional):
```javascript
// In cache.js middleware
const originalJson = res.json.bind(res);
res.json = function(data) {
  const cacheStatus = res.get('X-Cache') || 'MISS';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Cache: ${cacheStatus}`);
  return originalJson(data);
};
```

### Performance Timeline

```javascript
// Frontend
const startTime = performance.now();
const result = await cachedGet('/api/data');
const endTime = performance.now();
console.log(`Request took ${(endTime - startTime).toFixed(2)}ms`);
// Should be <10ms for cache hits
```

---

## Common Pitfalls to Avoid

❌ **Don't forget to invalidate cache after updates**
```javascript
// WRONG - Cache becomes stale
await Timesheet.updateOne({ _id: id }, { status: 'approved' });
res.json({ success: true });

// RIGHT - Cache is invalidated
await Timesheet.updateOne({ _id: id }, { status: 'approved' });
await invalidateTimesheetCache();
res.json({ success: true });
```

❌ **Don't cache user-specific data for too long**
```javascript
// WRONG - User might not see their own updated data
res.set('X-Cache-TTL', '3600'); // 1 hour

// RIGHT - Shorter cache for user data
res.set('X-Cache-TTL', '300'); // 5 minutes
```

❌ **Don't cache POST/PUT/DELETE responses**
- Only GET requests should be cached
- Mutations should always hit the server

---

## Testing Cache Features

### Frontend Test
```javascript
// In browser console:
import { apiCache } from './utils/cache';

// Check cached data
apiCache.get('your-key');

// Clear all cache
apiCache.clear();

// Monitor network tab while testing
```

### Backend Test
```bash
# Make a request and check cache header
curl -i http://localhost:5000/api/timesheets

# Should see: X-Cache: HIT (on second request)
```
