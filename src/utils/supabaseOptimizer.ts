
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

// Define a union type of all the table names to improve type safety
export type TableName = 
  | 'apl_workspace_members' 
  | 'apl_workspaces' 
  | 'apl_workspace_invitations' 
  | 'apl_user_credits' 
  | 'apl_auth_logs';

// Map with table schemas to reduce redundant queries
const TABLE_SCHEMAS: Record<TableName, string[]> = {
  'apl_workspace_members': ['id', 'workspace_id', 'user_id', 'role', 'created_at'],
  'apl_workspaces': ['id', 'name', 'initial', 'session_timeout', 'invite_enabled', 'user_id', 'created_at'],
  'apl_workspace_invitations': ['id', 'workspace_id', 'email', 'status', 'created_by', 'created_at'],
  'apl_user_credits': ['id', 'user_id', 'credits_used', 'credits_limit', 'reset_date', 'is_pro', 'created_at', 'updated_at'],
  'apl_auth_logs': ['id', 'user_id', 'action', 'device', 'created_at', 'details']
};

// Cache to store the results of queries
interface QueryCache<T> {
  data: T | null;
  count: number | null;
  timestamp: number;
  query: string;
}

const queryCache: Record<string, QueryCache<any>> = {};

// Cache duration in milliseconds
const CACHE_DURATION = 60000; // 1 minute

/**
 * Performs a paginated query with column selection and caching
 * @param table The table to query
 * @param columns Only the columns needed
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 * @param filters Optional filters to apply
 * @param cacheDuration Override the default cache duration
 */
export const paginatedQuery = async <T>(
  table: TableName,
  columns: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: Record<string, any>,
  cacheDuration: number = CACHE_DURATION
) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  
  // Create a cache key from the query parameters
  const filterString = filters ? JSON.stringify(filters) : '';
  const cacheKey = `${table}_${columns}_${page}_${pageSize}_${filterString}`;
  
  // Check if we have a cached result
  const cached = queryCache[cacheKey];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < cacheDuration) {
    console.log(`Using cached data for ${table}`);
    return { 
      data: cached.data, 
      count: cached.count, 
      error: null, 
      pageCount: cached.count ? Math.ceil(cached.count / pageSize) : 0 
    };
  }
  
  console.log(`Fetching fresh data for ${table}`);
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
  
  // Cache the result if successful
  if (!error) {
    queryCache[cacheKey] = {
      data,
      count,
      timestamp: now,
      query: cacheKey
    };
  }
  
  return { 
    data, 
    count, 
    error, 
    pageCount: count ? Math.ceil(count / pageSize) : 0 
  };
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
 */
export const getCount = async (table: TableName, filters?: Record<string, any>) => {
  // Create a cache key from the query parameters
  const filterString = filters ? JSON.stringify(filters) : '';
  const cacheKey = `count_${table}_${filterString}`;
  
  // Check if we have a cached result
  const cached = queryCache[cacheKey];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached count for ${table}`);
    return { count: cached.count, error: null };
  }
  
  console.log(`Fetching fresh count for ${table}`);
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
  
  // Cache the result if successful
  if (!error) {
    queryCache[cacheKey] = {
      data: null,
      count,
      timestamp: now,
      query: cacheKey
    };
  }
  
  return { count, error };
};

/**
 * Optimized query for WorkspaceDetailsDialog
 * Only fetch necessary data for a workspace
 */
export const getWorkspaceDetails = async (workspaceId: string) => {
  // Create a cache key
  const cacheKey = `workspace_details_${workspaceId}`;
  
  // Check if we have a cached result
  const cached = queryCache[cacheKey];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached workspace details for ${workspaceId}`);
    return { data: cached.data, error: null };
  }
  
  console.log(`Fetching fresh workspace details for ${workspaceId}`);
  const { data, error } = await supabase
    .from('apl_workspaces' as TableName)
    .select('id, name, invite_enabled')
    .eq('id', workspaceId)
    .single();
  
  // Cache the result if successful
  if (!error) {
    queryCache[cacheKey] = {
      data,
      count: null,
      timestamp: now,
      query: cacheKey
    };
  }
    
  return { data, error };
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
    
    await supabase.from('apl_auth_logs' as TableName).insert({
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
 * Clear the query cache or specific entries
 * @param tableNames Optional list of tables to clear from cache
 */
export const clearQueryCache = (tableNames?: TableName[]) => {
  if (!tableNames) {
    // Clear entire cache
    Object.keys(queryCache).forEach(key => delete queryCache[key]);
    console.log('Query cache cleared completely');
    return;
  }
  
  // Clear only specified tables
  tableNames.forEach(tableName => {
    Object.keys(queryCache).forEach(key => {
      if (key.startsWith(tableName)) {
        delete queryCache[key];
      }
    });
  });
  
  console.log(`Query cache cleared for tables: ${tableNames.join(', ')}`);
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
