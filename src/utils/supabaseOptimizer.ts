
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

/**
 * Utility functions to optimize Supabase queries and reduce egress usage
 */

/**
 * Performs a paginated query with column selection
 * @param table The table to query
 * @param columns Only the columns needed
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 * @param filters Optional filters to apply
 */
export const paginatedQuery = async (
  table: string,
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
export const getCount = async (table: string, filters?: Record<string, any>) => {
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
