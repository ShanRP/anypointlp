
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

type TableName = 'apl_workspace_members' | 'apl_workspaces' | 'apl_workspace_invitations' | 'apl_user_credits' | 'apl_auth_logs';

// Cache to store query results with expiration
interface CacheEntry {
  data: any;
  timestamp: number;
  count?: number;
}

const queryCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 60000; // Cache time-to-live: 1 minute

/**
 * Performs a paginated query with column selection
 * @param table The table to query
 * @param columns Only the columns needed
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 * @param filters Optional filters to apply
 * @param useCache Whether to use cache (default: true)
 */
export const paginatedQuery = async (
  table: TableName,
  columns: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: Record<string, any>,
  useCache: boolean = true
) => {
  // Generate cache key
  const cacheKey = `${table}:${columns}:${page}:${pageSize}:${JSON.stringify(filters || {})}`;
  
  // Check cache first if enabled
  if (useCache && queryCache[cacheKey] && (Date.now() - queryCache[cacheKey].timestamp) < CACHE_TTL) {
    console.log(`Using cached data for ${table}`);
    return queryCache[cacheKey].data;
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  
  let query = supabase
    .from(table)
    .select(columns, { count: 'exact' })
    .range(start, end);
  
  // Apply any filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, count, error } = await query;
  
  const result = { data, count, error, pageCount: count ? Math.ceil(count / pageSize) : 0 };
  
  // Store in cache if enabled
  if (useCache) {
    queryCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
  }
  
  return result;
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
  return debounce(fn, wait);
};

/**
 * Gets only a record count instead of fetching all records
 * @param table The table to query
 * @param filters Optional filters to apply
 * @param useCache Whether to use cache (default: true)
 */
export const getCount = async (
  table: TableName, 
  filters?: Record<string, any>,
  useCache: boolean = true
) => {
  // Generate cache key
  const cacheKey = `count:${table}:${JSON.stringify(filters || {})}`;
  
  // Check cache first if enabled
  if (useCache && queryCache[cacheKey] && (Date.now() - queryCache[cacheKey].timestamp) < CACHE_TTL) {
    console.log(`Using cached count for ${table}`);
    return queryCache[cacheKey].data;
  }
  
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true });
  
  // Apply any filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }
  
  const { count, error } = await query;
  
  const result = { count, error };
  
  // Store in cache if enabled
  if (useCache) {
    queryCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
  }
  
  return result;
};

/**
 * Clear all cached data
 */
export const clearQueryCache = () => {
  Object.keys(queryCache).forEach(key => delete queryCache[key]);
};

/**
 * Clear cached data for a specific table
 * @param table The table to clear cache for
 */
export const clearTableCache = (table: TableName) => {
  Object.keys(queryCache).forEach(key => {
    if (key.startsWith(`${table}:`) || key.startsWith(`count:${table}:`)) {
      delete queryCache[key];
    }
  });
};

/**
 * Optimized query for WorkspaceDetailsDialog
 * Only fetch necessary data for a workspace
 */
export const getWorkspaceDetails = async (workspaceId: string, useCache: boolean = true) => {
  const cacheKey = `workspaceDetails:${workspaceId}`;
  
  if (useCache && queryCache[cacheKey] && (Date.now() - queryCache[cacheKey].timestamp) < CACHE_TTL) {
    console.log(`Using cached workspace details for ${workspaceId}`);
    return queryCache[cacheKey].data;
  }
  
  const { data, error } = await supabase
    .from('apl_workspaces')
    .select('id, name, invite_enabled')
    .eq('id', workspaceId)
    .single();
  
  const result = { data, error };
  
  if (useCache) {
    queryCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
  }
  
  return result;
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
  // Implement debouncing for frequent identical logs
  // Only log critical actions or at intervals
  const cacheKey = `auditLog:${userId}:${action}`;
  const now = Date.now();
  
  // If the same action was logged recently, skip excessive logging
  if (queryCache[cacheKey] && (now - queryCache[cacheKey].timestamp) < 10000) { // 10 seconds throttle
    // Only increment count without inserting a new record
    queryCache[cacheKey].count = (queryCache[cacheKey].count || 1) + 1;
    return;
  }
  
  try {
    const device = navigator?.userAgent || 'Unknown device';
    
    await supabase.from('apl_auth_logs').insert({
      user_id: userId,
      action,
      device,
      details: details ? JSON.stringify(details) : null
    });
    
    // Record this log in cache to prevent duplicates
    queryCache[cacheKey] = {
      timestamp: now,
      count: 1,
      data: null
    };
    
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
 * Optimize batch fetching for task data
 * Reduces multiple individual requests to a single batch request
 */
export const batchFetchTasks = async (workspaceId: string, taskType: string, useCache: boolean = true) => {
  const cacheKey = `batchTasks:${workspaceId}:${taskType}`;
  
  if (useCache && queryCache[cacheKey] && (Date.now() - queryCache[cacheKey].timestamp) < CACHE_TTL) {
    console.log(`Using cached tasks for ${taskType}`);
    return queryCache[cacheKey].data;
  }
  
  const tableName = `apl_${taskType}_tasks`;
  
  const { data, error } = await supabase
    .from(tableName)
    .select('id, task_name, task_id, created_at, description')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  const result = { data, error };
  
  if (useCache) {
    queryCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
  }
  
  return result;
};
