
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
  workspace_id: string; 
  category: string; // Category of the task (dataweave, raml, integration, munit, sampledata, document, diagram)
  description?: string; // Optional description field
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
  workspace_id: string;
  category: string; // Category of the task
  description?: string; // Optional description field
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
      // Get DataWeave tasks
      const { data: dataWeaveTasks, error: dataWeaveError } = await supabase.rpc('apl_get_workspace_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (dataWeaveError) throw dataWeaveError;
      
      // Get Integration tasks
      const { data: integrationData, error: integrationError } = await supabase
        .from('apl_integration_tasks')
        .select('id, task_id, task_name, created_at, category, description')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
        
      if (integrationError) throw integrationError;
      
      // Format DataWeave tasks
      const dataWeaveFormattedTasks = (dataWeaveTasks as Array<{
        id: string;
        task_id: string;
        task_name: string;
        created_at: string;
        description?: string;
        category?: string;
      }> || []).map(task => ({
        ...task,
        workspace_id: workspaceId,
        description: task.description || '',
        category: task.category || 'dataweave',
        task_id: task.task_id || `T-${task.id.substring(0, 8).toUpperCase()}`
      }));
      
      // Format Integration tasks
      const integrationFormattedTasks = (integrationData || []).map(task => ({
        ...task,
        workspace_id: workspaceId,
        description: task.description || '',
        category: task.category || 'integration',
        task_id: task.task_id || `IG-${task.id.substring(0, 8).toUpperCase()}`
      }));
      
      // Combine and set all tasks
      const allTasks = [...dataWeaveFormattedTasks, ...integrationFormattedTasks];
      setTasks(allTasks);
      
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
      // First try to get from DataWeave tasks
      const { data: dataWeaveData, error: dataWeaveError } = await supabase.rpc('apl_get_task_details', { 
        task_id_param: taskId 
      });
      
      // If found in DataWeave tasks, use that
      if (!dataWeaveError && dataWeaveData && dataWeaveData.length > 0) {
        const taskDetails = dataWeaveData[0] as {
          id: string;
          task_id: string;
          task_name: string;
          input_format: string;
          input_samples: Json;
          output_samples: Json;
          notes: string;
          generated_scripts: Json;
          created_at: string;
          category?: string;
          description?: string;
        };
        
        const taskWithWorkspace = {
          ...taskDetails,
          workspace_id: workspaceId,
          category: taskDetails.category || 'dataweave',
          description: taskDetails.description || '',
          task_id: taskDetails.task_id || `T-${taskDetails.id.substring(0, 8).toUpperCase()}`
        } as TaskDetails;
        
        setSelectedTask(taskWithWorkspace);
        return;
      }
      
      // If not found in DataWeave tasks, try Integration tasks
      const { data: integrationData, error: integrationError } = await supabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (integrationError) throw new Error('Task not found in any table');
      
      if (integrationData) {
        const taskWithWorkspace = {
          ...integrationData,
          workspace_id: workspaceId,
          category: integrationData.category || 'integration',
          description: integrationData.description || '',
          task_id: integrationData.task_id || `IG-${integrationData.id.substring(0, 8).toUpperCase()}`
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
    task_id?: string;
    task_name: string;
    input_format: string;
    input_samples: any[];
    output_samples: any[];
    notes?: string;
    generated_scripts: any[];
    user_id: string;
    category: string;
    description?: string;
  }) => {
    try {
      // Generate a unique task_id if not provided
      const taskId = task.task_id || `T-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      // Determine which table to use based on category
      if (task.category === 'integration') {
        // Save to integration tasks table
        const taskData = {
          workspace_id: task.workspace_id,
          task_id: taskId,
          task_name: task.task_name,
          input_format: task.input_format,
          input_samples: JSON.parse(JSON.stringify(task.input_samples)) as Json,
          output_samples: JSON.parse(JSON.stringify(task.output_samples || [])) as Json,
          notes: task.notes || '',
          generated_scripts: JSON.parse(JSON.stringify(task.generated_scripts)) as Json,
          user_id: task.user_id,
          username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
          category: task.category,
          description: task.description || ''
        };

        const { data, error } = await supabase
          .from('apl_integration_tasks')
          .insert([taskData])
          .select();
        
        if (error) throw error;
        
        // Refresh the task list with the current workspace
        await fetchWorkspaceTasks();
        return data;
      } else {
        // Save to dataweave tasks table (existing functionality)
        const taskData = {
          workspace_id: task.workspace_id,
          task_id: taskId,
          task_name: task.task_name,
          input_format: task.input_format,
          input_samples: JSON.parse(JSON.stringify(task.input_samples)) as Json,
          output_samples: JSON.parse(JSON.stringify(task.output_samples || [])) as Json,
          notes: task.notes || '',
          generated_scripts: JSON.parse(JSON.stringify(task.generated_scripts)) as Json,
          user_id: task.user_id,
          username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
          category: task.category,
          description: task.description || ''
        };

        const { data, error } = await supabase
          .from('apl_dataweave_tasks')
          .insert([taskData])
          .select();
        
        if (error) throw error;
        
        // Refresh the task list with the current workspace
        await fetchWorkspaceTasks();
        return data;
      }
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
