
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCredits } from './useCredits';
import { toast } from 'sonner';

interface AIAssistantOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  enable_functions?: boolean;
}

export function useAIAssistant(options?: AIAssistantOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { useCredit, hasCredits } = useCredits();

  const generateContent = useCallback(async (
    prompt: string,
    examples?: Array<{ input: string, output: string }>,
    systemPrompt?: string
  ) => {
    if (!user) {
      toast.error('You must be logged in to use AI features');
      return null;
    }

    if (!hasCredits) {
      toast.error('You have reached your AI usage limit. Please upgrade your account or wait for your credits to reset.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Use a Supabase edge function to generate content
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt,
          examples: examples || [],
          systemPrompt: systemPrompt || '',
          options: options || {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Consume a credit if the request was successful
      await useCredit();
      
      return data;
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message);
      toast.error(`Error generating content: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, hasCredits, useCredit, options]);

  const generateCode = useCallback(async (
    description: string,
    language: string,
    additionalContext?: string
  ) => {
    if (!user) {
      toast.error('You must be logged in to use AI features');
      return null;
    }

    if (!hasCredits) {
      toast.error('You have reached your AI usage limit. Please upgrade your account or wait for your credits to reset.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Use a Supabase edge function to generate code
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: {
          description,
          language,
          additionalContext: additionalContext || '',
          options: options || {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Consume a credit if the request was successful
      await useCredit();
      
      return data;
    } catch (err: any) {
      console.error('Error generating code:', err);
      setError(err.message);
      toast.error(`Error generating code: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, hasCredits, useCredit, options]);

  return {
    loading,
    error,
    generateContent,
    generateCode
  };
}
