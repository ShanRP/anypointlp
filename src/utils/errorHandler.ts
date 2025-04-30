
import { toast } from 'sonner';

/**
 * Handles API errors and displays appropriate toast messages
 * @param error The error object
 * @param action The action that was being performed when the error occurred
 */
export const handleApiError = (error: unknown, action: string = 'API request') => {
  console.error(`Error during ${action}:`, error);
  
  // Try to extract and format error messages
  if (error instanceof Error) {
    toast.error(`${action} failed: ${error.message}`);
  } else if (typeof error === 'object' && error !== null) {
    let message = 'An unknown error occurred';
    
    // Try to extract message from Supabase error format
    if ('message' in error && typeof error.message === 'string') {
      message = error.message;
    } else if ('error' in error && typeof error.error === 'string') {
      message = error.error;
    }
    
    toast.error(`${action} failed: ${message}`);
  } else {
    toast.error(`${action} failed due to an unknown error`);
  }
};
