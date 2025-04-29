
import { debounce } from 'lodash';

/**
 * A utility that helps optimize network calls throughout the application
 */

interface RequestCache {
  [key: string]: {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
  };
}

// Main cache object
const requestCache: RequestCache = {};

// Default cache duration (5 minutes)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Optimizes function calls by caching results
 * @param fn The async function to optimize
 * @param cacheKey A unique key for this request
 * @param cacheDuration How long to cache results in milliseconds
 * @returns The cached or fresh result
 */
export const optimizeRequest = async <T>(
  fn: () => Promise<T>,
  cacheKey: string,
  cacheDuration: number = DEFAULT_CACHE_DURATION
): Promise<T> => {
  const currentTime = Date.now();
  const cachedRequest = requestCache[cacheKey];

  // Return cached data if it exists and hasn't expired
  if (
    cachedRequest &&
    currentTime - cachedRequest.timestamp < cacheDuration
  ) {
    return cachedRequest.data;
  }

  // If there's already a pending request for this key, return its promise
  if (cachedRequest?.promise) {
    return cachedRequest.promise;
  }

  // Create a new promise for this request
  const promise = fn();
  
  // Store the promise in the cache
  requestCache[cacheKey] = {
    data: null,
    timestamp: 0,
    promise
  };

  try {
    // Execute the request
    const result = await promise;
    
    // Store the successful result
    requestCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    // Remove the promise on error
    delete requestCache[cacheKey].promise;
    throw error;
  }
};

/**
 * Clears all cached requests or a specific one
 * @param cacheKey Optional specific key to clear
 */
export const clearRequestCache = (cacheKey?: string) => {
  if (cacheKey) {
    delete requestCache[cacheKey];
  } else {
    Object.keys(requestCache).forEach(key => {
      delete requestCache[key];
    });
  }
};

/**
 * Creates a debounced version of a function with additional caching
 * @param fn The function to debounce
 * @param wait Debounce wait time in milliseconds
 * @param cacheKey Optional cache key for persistent caching
 * @param cacheDuration Optional cache duration in milliseconds
 */
export const createOptimizedFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number = 300,
  cacheKey?: string,
  cacheDuration?: number
): T => {
  const debouncedFn = debounce(async (...args: any[]) => {
    if (cacheKey) {
      return optimizeRequest(
        () => fn(...args),
        `${cacheKey}-${JSON.stringify(args)}`,
        cacheDuration
      );
    }
    return fn(...args);
  }, wait);

  return debouncedFn as T;
};

/**
 * Tracks in-progress requests to prevent duplicate simultaneous calls
 */
const inProgressRequests: Record<string, Promise<any>> = {};

/**
 * Ensures that a function is not called multiple times in parallel
 * @param fn The function to protect
 * @param getKey Function that generates a unique key from the arguments
 */
export function preventDuplicateCalls<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getKey: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = getKey(...args);
    
    if (inProgressRequests[key]) {
      return inProgressRequests[key];
    }

    try {
      const promise = fn(...args);
      inProgressRequests[key] = promise;
      const result = await promise;
      return result;
    } finally {
      delete inProgressRequests[key];
    }
  }) as T;
}
