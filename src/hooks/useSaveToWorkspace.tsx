
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export const useSaveToWorkspace = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTask = async (task: {
    workspace_id: string;
    task_id: string;
    task_name: string;
    input_format: string;
    input_samples: any[];
    output_samples: any[];
    notes?: string;
    generated_scripts: any[];
    user_id: string;
    category: string;
    description?: string;
    username?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare task data for insertion
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: task.task_id,
        task_name: task.task_name,
        input_format: task.input_format,
        input_samples: JSON.parse(JSON.stringify(task.input_samples)) as Json,
        output_samples: JSON.parse(JSON.stringify(task.output_samples)) as Json,
        notes: task.notes || '',
        generated_scripts: JSON.parse(JSON.stringify(task.generated_scripts)) as Json,
        user_id: task.user_id,
        category: task.category,
        description: task.description || '',
        username: task.username || 'Anonymous'
      };

      // Insert task into database
      const { data, error } = await supabase
        .from('apl_dataweave_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      return data;
    } catch (err: any) {
      console.error('Error saving task to workspace:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveTask,
    loading,
    error
  };
};
