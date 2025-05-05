
import { toast } from 'sonner';

/**
 * Handles API errors and presents appropriate messages to the user
 * @param error The error object from the API call
 * @param context A string describing the operation context
 */
export const handleApiError = (error: any, context?: string) => {
  console.error(`Error in ${context || 'operation'}:`, error);
  
  // Extract error message
  const errorMessage = error?.message || error?.error?.message || 'An unknown error occurred';
  
  // Determine if this is a network error
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
    toast.error('Network connection issue. Please check your internet connection.');
    return;
  }
  
  // Handle authentication errors
  if (errorMessage.includes('Not authenticated') || errorMessage.includes('JWT')) {
    toast.error('Your session has expired. Please log in again.');
    return;
  }
  
  // Handle permission errors
  if (errorMessage.includes('permission denied') || errorMessage.toLowerCase().includes('not authorized')) {
    toast.error('You do not have permission to perform this action.');
    return;
  }
  
  // Display appropriate error message based on context
  if (context) {
    toast.error(`Error ${context.toLowerCase()}: ${errorMessage}`);
  } else {
    toast.error(errorMessage);
  }
};

/**
 * Formats and displays validation errors
 * @param errors Object containing validation errors
 */
export const handleValidationErrors = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors).map(([field, messages]) => {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
    return `${fieldName}: ${messages.join(', ')}`;
  });
  
  errorMessages.forEach(message => {
    toast.error(message);
  });
};

/**
 * Wraps an async function with error handling
 * @param fn The async function to wrap
 * @param context Context description for error messages
 * @returns A new function that handles errors
 */
export const withErrorHandling = (fn: Function, context?: string) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      throw error;
    }
  };
};
