
import { supabase } from '@/integrations/supabase/client';

/**
 * Batches array of items into smaller arrays
 * @param array The array to be batched
 * @param batchSize Size of each batch
 * @returns Array of batched arrays
 */
export const batchArray = <T>(array: T[], batchSize: number = 100): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Creates optimal RLS where clauses
 * @param columnName Column to filter on
 * @param values Values to include
 * @returns SQL where clause string
 */
export const createOptimalWhereClause = (columnName: string, values: string[]): string => {
  if (values.length === 0) return '';
  
  if (values.length === 1) {
    return `${columnName} = '${values[0]}'`;
  }
  
  return `${columnName} IN ('${values.join("','")}')`;
};

/**
 * Logs authentication events to the database
 * @param userId User ID
 * @param action Action name
 * @param metadata Additional metadata
 */
export const logAuditEvent = async (
  userId: string, 
  action: string, 
  metadata: Record<string, any> = {}
): Promise<void> => {
  try {
    await supabase.from('apl_auth_logs').insert({
      user_id: userId,
      action,
      device: metadata.device || 'unknown',
      ip_address: metadata.ip_address || 'unknown'
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

/**
 * Simple throttling function to limit API calls
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(...args: Parameters<T>): void {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Processes errors from Supabase responses
 * @param error Error object
 * @returns Formatted error message
 */
export const processSupabaseError = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  // Check for common error patterns
  if (error.message) {
    if (error.message.includes('JWT')) {
      return 'Authentication error. Please log in again.';
    }
    if (error.message.includes('permission') || error.message.includes('RLS')) {
      return 'You do not have permission to perform this action.';
    }
    return error.message;
  }
  
  if (error.error_description) {
    return error.error_description;
  }
  
  return JSON.stringify(error);
};
