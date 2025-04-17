
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

type TableName = 'apl_workspace_members' | 'apl_workspaces' | 'apl_workspace_invitations' | 'apl_user_credits' | 'apl_auth_logs';

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
  filters?: Record<string, any>
) => {
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
  
  return { data, count, error, pageCount: count ? Math.ceil(count / pageSize) : 0 };
};

/**
 * Creates a debounced function for Supabase queries
 * @param fn The function to debounce
 * @param wait Wait time in milliseconds
 */
export const createDebouncedQuery = <T>(
  fn: (...args: any[]) => Promise<T>,
  wait: number = 300
): ((...args: any[]) => Promise<T>) => {
  return debounce(fn, wait) as any;
};

/**
 * Gets only a record count instead of fetching all records
 * @param table The table to query
 * @param filters Optional filters to apply
 */
export const getCount = async (table: TableName, filters?: Record<string, any>) => {
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
  
  return { count, error };
};

/**
 * Optimized query for WorkspaceDetailsDialog
 * Only fetch necessary data for a workspace
 */
export const getWorkspaceDetails = async (workspaceId: string) => {
  const { data, error } = await supabase
    .from('apl_workspaces')
    .select('id, name, invite_enabled')
    .eq('id', workspaceId)
    .single();
    
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
