/**
 * Request deduplication - prevents duplicate API calls
 * Useful for avoiding multiple simultaneous requests for the same data
 */

class RequestQueue {
  constructor() {
    this.pending = new Map(); // key -> Promise
  }

  /**
   * Execute request only if not already in progress
   * @param {string} key - Unique request key
   * @param {function} requestFn - Async function that makes the request
   * @returns {Promise} Result of the request
   */
  async execute(key, requestFn) {
    // If request is already pending, return that promise
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Create and store the promise
    const promise = requestFn()
      .then(result => {
        this.pending.delete(key);
        return result;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear a specific pending request
   */
  clear(key) {
    this.pending.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pending.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingCount() {
    return this.pending.size;
  }
}

export const requestQueue = new RequestQueue();
export default RequestQueue;
