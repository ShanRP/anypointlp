
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';
import { networkOptimizer } from './networkOptimizer';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

type TableName = 'apl_workspace_members' | 'apl_workspaces' | 'apl_workspace_invitations' | 
                 'apl_user_credits' | 'apl_auth_logs' | 'apl_invitation_tokens';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Use a more specific type for the cache to avoid excessive type depth issues
const queryCache = new Map<string, CacheEntry<any>>();

export const clearCache = () => {
  queryCache.clear();
  networkOptimizer.clearCache();
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
  options: { cacheTime?: number } = {}
): Promise<{
  data: T[];
  count: number | null;
  error: any;
  pageCount: number;
}> => {
  const cacheTime = options.cacheTime || 300; // 5 minutes default
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  const cacheKey = `${table}-${columns}-${page}-${pageSize}-${JSON.stringify(filters)}`;
  
  // Use the network optimizer for this query
  const fetchData = async () => {
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
    return { 
      data: data as T[], 
      count, 
      error, 
      pageCount: count ? Math.ceil(count / pageSize) : 0 
    };
  };

  return networkOptimizer.optimizeRequest(
    cacheKey,
    fetchData,
    { cacheTime }
  );
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
  
  const fetchCount = async () => {
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
    return { count, error };
  };
  
  return networkOptimizer.optimizeRequest(
    cacheKey,
    fetchCount,
    { cacheTime: 300 } // 5 minutes
  );
};

/**
 * Optimized query for WorkspaceDetailsDialog
 * Only fetch necessary data for a workspace
 */
export const getWorkspaceDetails = async (workspaceId: string) => {
  const cacheKey = `workspace-${workspaceId}`;
  
  const fetchDetails = async () => {
    const { data, error } = await supabase
      .from('apl_workspaces')
      .select('id, name, invite_enabled')
      .eq('id', workspaceId)
      .single();
    
    return { data, error };
  };
  
  return networkOptimizer.optimizeRequest(
    cacheKey,
    fetchDetails,
    { cacheTime: 300 } // 5 minutes
  );
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

    // Do not cache audit events
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
  
  const checkAccess = async () => {
    // Check if user is the owner or a member
    const { data: membership, error } = await supabase
      .from('apl_workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();
      
    return !!membership;
  };
  
  return networkOptimizer.optimizeRequest(
    cacheKey,
    checkAccess,
    { cacheTime: 600 } // 10 minutes since access permissions don't change often
  );
};

/**
 * Get invitation details
 * @param token The invitation token
 */
export const getInvitationDetails = async (token: string, workspaceId: string) => {
  const cacheKey = `invitation-${token}-${workspaceId}`;
  
  const fetchInvitation = async () => {
    // Use direct query with type assertion to avoid TypeScript errors
    const { data, error } = await supabase
      .from('apl_invitation_tokens' as any)
      .select('invitation_id, workspace_id, email, expires_at')
      .eq('token', token)
      .eq('workspace_id', workspaceId)
      .single();
      
    return { data, error };
  };
  
  return networkOptimizer.optimizeRequest(
    cacheKey,
    fetchInvitation,
    { cacheTime: 120 } // 2 minutes
  );
};

/**
 * Accept a workspace invitation
 * @param workspaceId The workspace ID
 * @param token The invitation token
 * @param userId The user accepting the invitation
 */
export const acceptWorkspaceInvitation = async (workspaceId: string, token: string) => {
  const result = await supabase.functions.invoke('accept-workspace-invitation', {
    method: 'POST',
    body: { workspaceId, token }
  });
  
  // Invalidate related caches on success
  if (result && !result.error) {
    networkOptimizer.invalidateByPrefix(`workspace-${workspaceId}`);
    networkOptimizer.invalidate(`invitation-${token}-${workspaceId}`);
  }
  
  return result;
};
