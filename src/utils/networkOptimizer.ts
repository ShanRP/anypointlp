
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
};

interface NetworkOptimizerOptions {
  cacheTime?: number; // In seconds
  deduplicate?: boolean;
  staleWhileRevalidate?: boolean;
}

class NetworkOptimizer {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultOptions: NetworkOptimizerOptions = {
    cacheTime: 300, // 5 minutes default
    deduplicate: true,
    staleWhileRevalidate: true,
  };

  /**
   * Optimize a network request
   * @param key Cache key for the request
   * @param fetchFunction Async function to fetch data
   * @param options Cache options
   */
  async optimizeRequest<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: NetworkOptimizerOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Math.floor(Date.now() / 1000);

    // Check if we have a valid cached entry
    if (this.cache.has(key)) {
      const cachedEntry = this.cache.get(key)!;
      const cacheExpiry = cachedEntry.timestamp + (opts.cacheTime || 300);

      // Return from cache if still valid
      if (now < cacheExpiry) {
        console.log(`[Network] Cache hit for key: ${key}`);
        return cachedEntry.data;
      }

      // If we're using stale-while-revalidate and have cached data
      if (opts.staleWhileRevalidate && cachedEntry.data) {
        // Revalidate in background
        this.revalidateInBackground(key, fetchFunction);
        // Return stale data immediately
        console.log(`[Network] Returning stale data for key: ${key} while revalidating`);
        return cachedEntry.data;
      }
    }

    // Deduplicate in-flight requests
    if (opts.deduplicate && this.pendingRequests.has(key)) {
      console.log(`[Network] Deduplicating request for key: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // Execute the fetch
    console.log(`[Network] Cache miss for key: ${key}, fetching fresh data`);
    const promise = fetchFunction()
      .then((data) => {
        this.cache.set(key, {
          data,
          timestamp: now,
        });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Refresh data in the background without blocking
   */
  private revalidateInBackground<T>(key: string, fetchFunction: () => Promise<T>): void {
    fetchFunction()
      .then((data) => {
        this.cache.set(key, {
          data,
          timestamp: Math.floor(Date.now() / 1000),
        });
        console.log(`[Network] Background revalidation complete for key: ${key}`);
      })
      .catch((error) => {
        console.error(`[Network] Background revalidation failed for key: ${key}:`, error);
      });
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`[Network] Cache invalidated for key: ${key}`);
  }

  /**
   * Invalidate all cache entries that match a prefix
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        console.log(`[Network] Cache invalidated for key: ${key} (prefix: ${prefix})`);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log(`[Network] Cache cleared completely`);
  }
}

// Export a singleton instance
export const networkOptimizer = new NetworkOptimizer();
