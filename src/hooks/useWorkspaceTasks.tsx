
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

export interface WorkspaceTask {
  id: string;
  task_id: string;
  task_name: string;
  created_at: string;
  workspace_id: string; // Added to track which workspace this task belongs to
  category?: string; // Added this field since it's used in the sidebar
  description?: string; // Adding optional description field
}

export interface TaskDetails {
  id: string;
  task_id: string;
  task_name: string;
  input_format: string;
  input_samples: any[];
  output_samples: any[];
  notes: string;
  generated_scripts: any[];
  created_at: string;
  workspace_id: string; // Added to track which workspace this task belongs to
  description?: string; // Adding optional description field
}

export interface IntegrationGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

export const useWorkspaceTasks = (workspaceId: string) => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('apl_get_workspace_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) throw error;
      
      // Ensure each task is associated with the current workspace
      const workspaceTasks = (data as Array<{
        id: string;
        task_id: string;
        task_name: string;
        created_at: string;
        description?: string;
        category?: string;
      }> || []).map(task => ({
        ...task,
        workspace_id: workspaceId, // Explicitly set workspace_id
        description: task.description || '', // Include description with fallback
        category: task.category || 'dataweave' // Set default category if not present
      }));
      
      setTasks(workspaceTasks);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchTaskDetails = async (taskId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('apl_get_task_details', { 
        task_id_param: taskId 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Handle the case where the description field might not be present in the return type
        // of the apl_get_task_details function
        const taskDetails = data[0] as {
          id: string;
          task_id: string;
          task_name: string;
          input_format: string;
          input_samples: Json;
          output_samples: Json;
          notes: string;
          generated_scripts: Json;
          created_at: string;
          description?: string; // Making this optional since it might not be in the RPC return
        };
        
        // Set the workspace_id on the task details
        const taskWithWorkspace = {
          ...taskDetails,
          workspace_id: workspaceId,
          description: taskDetails.description || '' // Ensure description exists with a fallback
        } as TaskDetails;
        
        setSelectedTask(taskWithWorkspace);
      } else {
        setSelectedTask(null);
        toast.warning('Task not found');
      }
    } catch (err: any) {
      console.error('Error fetching task details:', err);
      setError(err.message);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

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
    description?: string; // Adding optional description field
  }) => {
    try {
      // Ensure workspace_id is set correctly
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: task.task_id,
        task_name: task.task_name,
        input_format: task.input_format,
        input_samples: JSON.parse(JSON.stringify(task.input_samples)) as Json,
        output_samples: JSON.parse(JSON.stringify(task.output_samples)) as Json,
        notes: task.notes,
        generated_scripts: JSON.parse(JSON.stringify(task.generated_scripts)) as Json,
        user_id: task.user_id,
        username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
        description: task.description
      };

      const { data, error } = await supabase
        .from('apl_dataweave_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      // Refresh the task list with the current workspace
      await fetchWorkspaceTasks();
      return data;
    } catch (err: any) {
      console.error('Error saving task:', err);
      toast.error('Failed to save task');
      throw err;
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceTasks();
    } else {
      setTasks([]); // Clear tasks if no workspace is selected
    }
  }, [workspaceId, fetchWorkspaceTasks]);

  return {
    tasks,
    selectedTask,
    loading,
    error,
    fetchWorkspaceTasks,
    fetchTaskDetails,
    saveTask
  };
};
