/**
 * Lazy Loading and Code Splitting Utilities
 * For optimized React component loading
 */

import React, { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
  >
    <CircularProgress />
  </Box>
);

/**
 * Lazy load a component with loading state
 * @param {function} importFn - Dynamic import function
 * @param {object} options - { fallback, delay }
 */
export const lazyLoad = (importFn, options = {}) => {
  const { fallback = <LoadingFallback /> } = options;
  const Component = lazy(importFn);

  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * Memoized list rendering for large lists
 * Prevents unnecessary re-renders
 */
export const useMemoList = (items, renderItem, keyFn = (item, index) => index) => {
  return React.useMemo(
    () => items.map((item, index) => (
      <React.Fragment key={keyFn(item, index)}>
        {renderItem(item, index)}
      </React.Fragment>
    )),
    [items, renderItem, keyFn]
  );
};

/**
 * Debounced state update
 * Useful for search inputs, filters
 */
export const useDebouncedState = (initialValue, delay = 500) => {
  const [value, setValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, setValue, value];
};

/**
 * Throttled callback
 * Useful for scroll/resize events
 */
export const useThrottledCallback = (callback, delay = 1000) => {
  const lastCallRef = React.useRef(Date.now());
  const timeoutRef = React.useRef(null);

  return React.useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
};

/**
 * Performance monitoring hook
 * Logs component render time
 */
export const useRenderTime = (componentName) => {
  React.useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [componentName]);
};
