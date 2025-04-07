
import { supabase } from '@/integrations/supabase/client';

/**
 * Gets an API key from Supabase securely without exposing it in frontend code
 * This function should be called from edge functions, never directly from frontend
 */
export const getApiKey = async (keyName: string): Promise<string | null> => {
  try {
    // Call the custom function directly, which will be created if it doesn't exist
    const { data, error } = await supabase.functions.invoke('secure-get-api-key', {
      body: { keyName }
    });
    
    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
    
    return data.apiKey;
  } catch (error) {
    console.error('Failed to fetch API key:', error);
    return null;
  }
};

/**
 * Creates a proxy request to an API through Supabase Edge Functions
 * @param path The API endpoint path
 * @param options Request options
 */
export const createSecureApiRequest = async (path: string, options: RequestInit = {}) => {
  // This function makes API requests through Supabase edge functions
  // instead of directly exposing API keys in the frontend
  const response = await fetch(`/api/secure-api-proxy?path=${encodeURIComponent(path)}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    }
  });
  
  return response.json();
};
