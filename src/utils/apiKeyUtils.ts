
import { supabase } from '@/integrations/supabase/client';

// API key cache to prevent repeated calls
const apiKeyCache = new Map<string, {
  key: string | null;
  timestamp: number;
  expiryTime: number;
}>();

// Default cache time (5 minutes)
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

// Active requests tracking to prevent duplicate in-flight calls
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Gets an API key from Supabase securely without exposing it in frontend code
 * This function should be called from edge functions, never directly from frontend
 */
export const getApiKey = async (keyName: string, forceRefresh = false): Promise<string | null> => {
  // Generate cache key
  const cacheKey = `api-key-${keyName}`;

  // Check if we have a cached key and it's not expired
  const cachedKey = apiKeyCache.get(cacheKey);
  if (!forceRefresh && cachedKey && Date.now() < cachedKey.timestamp + cachedKey.expiryTime) {
    console.log(`Using cached API key for: ${keyName}`);
    return cachedKey.key;
  }

  // Check if a request for this key is already in progress
  if (pendingRequests.has(cacheKey)) {
    console.log(`Request for API key ${keyName} already in progress, reusing...`);
    return pendingRequests.get(cacheKey)!;
  }

  // Create a new request
  const request = (async () => {
    try {
      // Use the get-api-key edge function instead of direct RPC
      const { data, error } = await supabase.functions.invoke('get-api-key', {
        body: { keyName }
      });
      
      if (error) {
        console.error('Error fetching API key:', error);
        return null;
      }
      
      const apiKey = data?.apiKey || null;
      
      // Cache the result
      apiKeyCache.set(cacheKey, {
        key: apiKey,
        timestamp: Date.now(),
        expiryTime: DEFAULT_CACHE_TIME
      });
      
      return apiKey;
    } catch (error) {
      console.error('Failed to fetch API key:', error);
      return null;
    } finally {
      // Remove the pending request
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the request in the pending map
  pendingRequests.set(cacheKey, request);
  
  return request;
};

/**
 * Creates a proxy request to an API through Supabase Edge Functions
 * @param path The API endpoint path
 * @param options Request options
 */
export const createSecureApiRequest = async (path: string, options: RequestInit = {}) => {
  // Cache key based on path and request body
  const cacheKey = `api-request-${path}-${JSON.stringify(options.body || {})}`;
  
  // Check if a request to this endpoint with these parameters is already in progress
  if (pendingRequests.has(cacheKey)) {
    console.log(`Request for ${path} already in progress, reusing...`);
    return pendingRequests.get(cacheKey)!;
  }
  
  // Create a new request
  const request = (async () => {
    try {
      // This function makes API requests through Supabase edge functions
      // instead of directly exposing API keys in the frontend
      const response = await fetch(`/api/secure-api-proxy?path=${encodeURIComponent(path)}`, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      });
      
      return response.json();
    } finally {
      // Remove the pending request
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store the request
  pendingRequests.set(cacheKey, request);
  
  return request;
};
