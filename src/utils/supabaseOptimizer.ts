
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

type TableName = 'apl_workspace_members' | 'apl_workspaces' | 'apl_workspace_invitations' | 'apl_user_credits' | 'apl_auth_logs' | 'apl_invitation_tokens';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Use a more specific type for the cache to avoid excessive type depth issues
const queryCache = new Map<string, CacheEntry<any>>();

export const clearCache = () => queryCache.clear();

/**
 * Performs a paginated query with column selection
 * @param table The table to query
 * @param columns Only the columns needed
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 * @param filters Optional filters to apply
 */
export const paginatedQuery = async (
  table: TableName,
  columns: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: Record<string, any>,
  options: { cacheTime?: number } = {}
) => {
  const cacheTime = options.cacheTime || 300; // 5 minutes default
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  const cacheKey = `${table}-${columns}-${page}-${pageSize}-${JSON.stringify(filters)}`;

  if (queryCache.has(cacheKey)) {
    const cachedData = queryCache.get(cacheKey);
    if (cachedData && cachedData.timestamp + (cacheTime * 1000) > Date.now()) {
      return cachedData.data;
    }
  }

  let query = supabase
    .from(table)
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
  const result = { data, count, error, pageCount: count ? Math.ceil(count / pageSize) : 0 };
  queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
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
  return debounce(fn, wait) as T;
};

/**
 * Gets only a record count instead of fetching all records
 * @param table The table to query
 * @param filters Optional filters to apply
 */
export const getCount = async (table: TableName, filters?: Record<string, any>) => {
  const cacheKey = `${table}-count-${JSON.stringify(filters)}`;
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)?.data;
  }
  
  let query = supabase
    .from(table)
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
};

/**
 * Optimized query for WorkspaceDetailsDialog
 * Only fetch necessary data for a workspace
 */
export const getWorkspaceDetails = async (workspaceId: string) => {
  const cacheKey = `workspace-${workspaceId}`;
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)?.data;
  }
  
  const { data, error } = await supabase
    .from('apl_workspaces')
    .select('id, name, invite_enabled')
    .eq('id', workspaceId)
    .single();

  const result = { data, error };
  queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
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
export const verifyWorkspaceAccess = async (workspaceId: string, userId: string): Promise<boolean> => {
  const cacheKey = `workspace-access-${workspaceId}-${userId}`;
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)?.data;
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
export const getInvitationDetails = async (token: string, workspaceId: string) => {
  const cacheKey = `invitation-${token}-${workspaceId}`;
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)?.data;
  }
  
  const { data, error } = await supabase
    .from('apl_invitation_tokens')
    .select('invitation_id, workspace_id, email, expires_at')
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
 * @param userId The user accepting the invitation
 */
export const acceptWorkspaceInvitation = async (workspaceId: string, token: string) => {
  return await supabase.functions.invoke('accept-workspace-invitation', {
    method: 'POST',
    body: { workspaceId, token }
  });
};
