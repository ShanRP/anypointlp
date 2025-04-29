
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

type TableName = 'apl_workspace_members' | 'apl_workspaces' | 'apl_workspace_invitations' | 
                 'apl_user_credits' | 'apl_auth_logs' | 'apl_invitation_tokens' |
                 'apl_job_posts' | 'apl_job_comments';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Use a more specific type for the cache to avoid excessive type depth issues
const queryCache = new Map<string, CacheEntry<any>>();

// Set of in-flight requests to prevent duplicate calls
const pendingRequests = new Set<string>();

// Configure global cache settings
const DEFAULT_CACHE_TIME = 60; // 1 minute default cache time
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

export const clearCache = () => {
  console.log('Clearing entire Supabase query cache');
  queryCache.clear();
  pendingRequests.clear();
};

export const clearCacheByPrefix = (prefix: string) => {
  console.log(`Clearing cache entries with prefix: ${prefix}`);
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
};

/**
 * Performs a paginated query with column selection
 * @param table The table to query
 * @param columns Only the columns needed
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 * @param filters Optional filters to apply
 */
export const paginatedQuery = async <T>(
  table: TableName,
  columns: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: Record<string, any>,
  options: { cacheTime?: number; forceRefresh?: boolean } = {}
): Promise<{
  data: T[];
  count: number | null;
  error: any;
  pageCount: number;
}> => {
  const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME; // Default to 1 minute
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  const cacheKey = `${table}-${columns}-${page}-${pageSize}-${JSON.stringify(filters)}`;

  // Return cached data if available and not forcing refresh
  if (!options.forceRefresh && queryCache.has(cacheKey)) {
    const cachedData = queryCache.get(cacheKey);
    if (cachedData && cachedData.timestamp + (cacheTime * 1000) > Date.now()) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedData.data;
    }
  }

  // Prevent duplicate in-flight requests for the same data
  if (pendingRequests.has(cacheKey)) {
    console.log(`Request for ${cacheKey} already in progress, waiting...`);
    // Wait until the pending request completes and return the cached result
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!pendingRequests.has(cacheKey)) {
          const result = queryCache.get(cacheKey)?.data;
          if (result) {
            resolve(result);
          } else {
            // If for some reason the cache doesn't have the result, resolve with empty data
            resolve({ data: [], count: 0, error: null, pageCount: 0 });
          }
        } else {
          setTimeout(checkCache, 50); // Check again in 50ms
        }
      };
      checkCache();
    });
  }

  try {
    pendingRequests.add(cacheKey);

    // Use type assertion to prevent TypeScript errors with dynamic table names
    let query = supabase
      .from(table as any)
      .select(columns, { count: 'exact' })
      .range(start, end);

    // Apply any filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Use if-statement instead of chaining to avoid type depth issues
          if (key && value) {
            query = query.eq(key, value);
          }
        }
      });
    }

    const { data, count, error } = await query;
    const result = { 
      data: data as T[], 
      count, 
      error, 
      pageCount: count ? Math.ceil(count / pageSize) : 0 
    };
    
    // Cache the result
    queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    // Clean up cache if it gets too large
    if (queryCache.size > MAX_CACHE_SIZE) {
      // Remove the oldest entries
      const keysToDelete = [...queryCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(MAX_CACHE_SIZE / 4))
        .map(entry => entry[0]);
        
      keysToDelete.forEach(key => queryCache.delete(key));
      console.log(`Cache cleanup: removed ${keysToDelete.length} oldest entries`);
    }
    
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
};

/**
 * Creates a debounced function for Supabase queries
 * @param fn The function to debounce
 * @param wait Wait time in milliseconds
 */
export const createDebouncedQuery = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number = 300
) => {
  return debounce(fn, wait) as T;
};

/**
 * Gets only a record count instead of fetching all records
 * @param table The table to query
 * @param filters Optional filters to apply
 */
export const getCount = async (
  table: TableName, 
  filters?: Record<string, any>,
  options: { cacheTime?: number; forceRefresh?: boolean } = {}
) => {
  const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME;
  const cacheKey = `${table}-count-${JSON.stringify(filters)}`;
  
  if (!options.forceRefresh && queryCache.has(cacheKey)) {
    const cachedData = queryCache.get(cacheKey);
    if (cachedData && cachedData.timestamp + (cacheTime * 1000) > Date.now()) {
      return cachedData.data;
    }
  }

  // Prevent duplicate in-flight requests
  if (pendingRequests.has(cacheKey)) {
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!pendingRequests.has(cacheKey)) {
          resolve(queryCache.get(cacheKey)?.data || { count: 0, error: null });
        } else {
          setTimeout(checkCache, 50);
        }
      };
      checkCache();
    });
  }
  
  try {
    pendingRequests.add(cacheKey);
    
    // Use type assertion for the table name
    let query = supabase
      .from(table as any)
      .select('id', { count: 'exact', head: true });

    // Apply any filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Use if-statement instead of chaining to avoid type depth issues
          if (key && value) {
            query = query.eq(key, value);
          }
        }
      });
    }

    const { count, error } = await query;
    const result = { count, error };
    queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
};

/**
 * Optimized query for WorkspaceDetailsDialog
 * Only fetch necessary data for a workspace
 */
export const getWorkspaceDetails = async (
  workspaceId: string,
  options: { cacheTime?: number; forceRefresh?: boolean } = {}
) => {
  const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME;
  const cacheKey = `workspace-${workspaceId}`;
  
  if (!options.forceRefresh && queryCache.has(cacheKey)) {
    const cachedData = queryCache.get(cacheKey);
    if (cachedData && cachedData.timestamp + (cacheTime * 1000) > Date.now()) {
      return cachedData.data;
    }
  }

  // Prevent duplicate in-flight requests
  if (pendingRequests.has(cacheKey)) {
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!pendingRequests.has(cacheKey)) {
          resolve(queryCache.get(cacheKey)?.data || { data: null, error: null });
        } else {
          setTimeout(checkCache, 50);
        }
      };
      checkCache();
    });
  }
  
  try {
    pendingRequests.add(cacheKey);
    
    const { data, error } = await supabase
      .from('apl_workspaces')
      .select('id, name, invite_enabled')
      .eq('id', workspaceId)
      .single();

    const result = { data, error };
    queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
};

/**
 * Log a security or audit event
 * @param userId User ID 
 * @param action Action being performed
 * @param details Optional details about the action
 */
export const logAuditEvent = async (
  userId: string, 
  action: string, 
  details?: Record<string, any>
) => {
  try {
    const device = navigator?.userAgent || 'Unknown device';

    await supabase.from('apl_auth_logs').insert({
      user_id: userId,
      action,
      device,
      details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw as we don't want to break app functionality due to logging failures
  }
};

/**
 * Handles secure token management to avoid exposing sensitive keys
 */
export const generateSecureRequestSignature = (payload: any): string => {
  // In a real implementation, this would use crypto APIs to create a secure signature
  // This is a simplified example
  const timestamp = Date.now();
  const requestId = crypto.randomUUID();

  // Concatenate timestamp and requestId to create a unique signature
  return `${timestamp}.${requestId}`;
};

/**
 * Verify if a user has permission to access a specific workspace
 * @param workspaceId The workspace to check
 * @param userId The user ID to verify
 */
export const verifyWorkspaceAccess = async (
  workspaceId: string, 
  userId: string,
  options: { cacheTime?: number; forceRefresh?: boolean } = {}
): Promise<boolean> => {
  const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME;
  const cacheKey = `workspace-access-${workspaceId}-${userId}`;
  
  if (!options.forceRefresh && queryCache.has(cacheKey)) {
    const cachedData = queryCache.get(cacheKey);
    if (cachedData && cachedData.timestamp + (cacheTime * 1000) > Date.now()) {
      return cachedData.data;
    }
  }
  
  // Check if user is the owner or a member
  const { data: membership, error } = await supabase
    .from('apl_workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();
    
  const hasAccess = !!membership;
  queryCache.set(cacheKey, { data: hasAccess, timestamp: Date.now() });
  
  return hasAccess;
};

/**
 * Get invitation details
 * @param token The invitation token
 */
export const getInvitationDetails = async (
  token: string, 
  workspaceId: string,
  options: { cacheTime?: number; forceRefresh?: boolean } = {}
) => {
  const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME;
  const cacheKey = `invitation-${token}-${workspaceId}`;
  
  if (!options.forceRefresh && queryCache.has(cacheKey)) {
    const cachedData = queryCache.get(cacheKey);
    if (cachedData && cachedData.timestamp + (cacheTime * 1000) > Date.now()) {
      return cachedData.data;
    }
  }
  
  // Use direct query with type assertion to avoid TypeScript errors
  const { data, error } = await supabase
    .from('apl_workspace_invitations')
    .select('id, workspace_id, email, expires_at, token')
    .eq('token', token)
    .eq('workspace_id', workspaceId)
    .single();
    
  const result = { data, error };
  queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
  
  return result;
};

/**
 * Accept a workspace invitation
 * @param workspaceId The workspace ID
 * @param token The invitation token
 */
export const acceptWorkspaceInvitation = async (workspaceId: string, token: string) => {
  // This operation modifies data, so we should invalidate related cache entries
  clearCacheByPrefix(`workspace-${workspaceId}`);
  clearCacheByPrefix(`invitation-${token}`);
  
  return await supabase.rpc('apl_accept_workspace_invitation', {
    workspace_id_param: workspaceId,
    user_id_param: supabase.auth.getUser().then(res => res.data.user?.id)
  });
};
