/**
 * Cache Invalidation Helpers
 * Utility functions to invalidate cache after data modifications
 */

// Cache disabled for shared hosting - these are no-op functions
const getCache = () => ({
  deletePattern: async () => {},
  delete: async () => {},
  flush: async () => {}
});

/**
 * Invalidate cache for timesheets and related endpoints
 */
const invalidateTimesheetCache = async () => {
  // No-op when Redis is disabled
  return;
};

/**
 * Invalidate cache for users and related endpoints
 */
const invalidateUserCache = async () => {
  // No-op when Redis is disabled
  return;
};

/**
 * Invalidate cache for projects and related endpoints
 */
const invalidateProjectCache = async () => {
  // No-op when Redis is disabled
  return;
};

/**
 * Invalidate cache for reports and stats
 */
const invalidateReportsCache = async () => {
  // No-op when Redis is disabled
  return;
};

/**
 * Invalidate all caches
 */
const invalidateAllCache = async () => {
  // No-op when Redis is disabled
  return;
};

/**
 * Invalidate specific route cache
 */
const invalidateRoute = async (route) => {
  // No-op when Redis is disabled
  return;
};

module.exports = {
  invalidateTimesheetCache,
  invalidateUserCache,
  invalidateProjectCache,
  invalidateReportsCache,
  invalidateAllCache,
  invalidateRoute
};
