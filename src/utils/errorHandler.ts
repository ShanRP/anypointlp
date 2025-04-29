
import { toast } from 'sonner';

// Error storage to prevent duplicate toasts
const errorCache: Record<string, number> = {};

/**
 * Helper function to handle API errors with deduplication
 * @param error The error object or message
 * @param context Optional context for the error
 * @param dedupKey Optional key to prevent duplicate error messages
 */
export const handleApiError = (
  error: any,
  context: string = 'Operation',
  dedupKey: string = ''
) => {
  // Extract the error message
  const errorMessage = error?.message || error?.error?.message || 
    (typeof error === 'string' ? error : 'An unknown error occurred');
  
  // Create a deduplication key if none provided
  const key = dedupKey || `${context}-${errorMessage}`;
  const now = Date.now();
  
  // Only show errors once per minute
  if (!errorCache[key] || now - errorCache[key] > 60000) {
    console.error(`${context} error:`, error);
    
    // Don't show "no rows returned" errors for new users
    if (errorMessage.includes('no rows returned') || 
        errorMessage.includes('not found')) {
      // For settings page and similar scenarios, just log it
      console.log(`Suppressed error toast for new user: ${errorMessage}`);
    } else {
      // Show other errors to the user
      toast.error(`${context} failed: ${errorMessage}`);
    }
    
    // Update the error cache
    errorCache[key] = now;
  } else {
    // Just log duplicate errors
    console.log(`Suppressed duplicate error: ${errorMessage}`);
  }

  return error; // Return the error for potential chaining
};

/**
 * Helper function to handle data loading errors
 * Suppresses common "not found" errors for new users
 */
export const handleDataLoadingError = (
  error: any,
  context: string = 'Data loading'
) => {
  // Extract the error message
  const errorMessage = error?.message || error?.error?.message || 
    (typeof error === 'string' ? error : 'An unknown error occurred');
  
  // For new user data loading, suppress common "not found" errors
  if (errorMessage.includes('no rows returned') || 
      errorMessage.includes('not found')) {
    console.log(`New user data not found: ${errorMessage}`);
    return null;
  }
  
  // Otherwise handle normally
  handleApiError(error, context);
  return null;
};

/**
 * Helper function to handle errors in a try-catch block
 * @param fn The async function to execute
 * @param context The context for error messages
 * @param dedupKey Optional key to prevent duplicate error messages
 * @returns The result of the function or null on error
 */
export const tryAsync = async <T>(
  fn: () => Promise<T>, 
  context: string = 'Operation',
  dedupKey: string = ''
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, context, dedupKey);
    return null;
  }
};
