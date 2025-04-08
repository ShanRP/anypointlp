
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { IntegrationTask, createCustomSupabaseClient } from '@/integrations/supabase/database.types';

// Create a typed client
const typedSupabase = createCustomSupabaseClient(supabase);

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

// Define a specific type for integration task details
export interface IntegrationTaskDetails extends TaskDetails {
  flow_summary?: string;
  flow_implementation?: string;
  flow_constants?: string;
  pom_dependencies?: string;
  compilation_check?: string;
}

export interface IntegrationGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

export const useWorkspaceTasks = (workspaceId: string) => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | IntegrationTaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First fetch dataweave tasks
      const { data: dataweaveData, error: dataweaveError } = await supabase.rpc('apl_get_workspace_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (dataweaveError) throw dataweaveError;
      
      // Then fetch integration tasks directly from the table
      const { data: integrationData, error: integrationError } = await typedSupabase
        .from('apl_integration_tasks')
        .select('id, task_id, task_name, created_at, workspace_id, category, description')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false });
      
      if (integrationError) throw integrationError;
      
      // Ensure each dataweave task is formatted properly
      const dataweaveTasksFormatted = (dataweaveData as Array<{
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
      
      // Format integration tasks
      const integrationTasksFormatted = (integrationData || []).map(task => ({
        ...task,
        workspace_id: workspaceId,
        description: task.description || '',
        category: task.category || 'integration',
        task_id: task.task_id || `IG-${task.id.substring(0, 8).toUpperCase()}`
      }));
      
      // Combine both types of tasks
      const allTasks = [...dataweaveTasksFormatted, ...integrationTasksFormatted];
      
      // Sort by created_at (newest first)
      allTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTasks(allTasks);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user?.id]);

  const fetchTaskDetails = async (taskId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to get the task from dataweave tasks
      const { data: dataweaveData, error: dataweaveError } = await supabase.rpc('apl_get_task_details', { 
        task_id_param: taskId 
      });
      
      if (dataweaveError) {
        console.log('Not found in dataweave tasks, trying integration tasks');
      }
      
      // If found in dataweave tasks
      if (dataweaveData && dataweaveData.length > 0) {
        const taskDetails = dataweaveData[0] as {
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
      
      // If not found in dataweave tasks, try integration tasks
      const { data: integrationData, error: integrationError } = await typedSupabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (integrationError) {
        // If not found in either table
        setSelectedTask(null);
        toast.warning('Task not found');
        return;
      }
      
      // Format integration task
      const integrationTask: IntegrationTaskDetails = {
        id: integrationData.id,
        task_id: integrationData.task_id || `IG-${integrationData.id.substring(0, 8).toUpperCase()}`,
        task_name: integrationData.task_name,
        input_format: integrationData.input_format,
        input_samples: integrationData.input_samples || [],
        output_samples: integrationData.output_samples || [],
        notes: integrationData.notes || '',
        generated_scripts: integrationData.generated_scripts || [],
        created_at: integrationData.created_at,
        workspace_id: workspaceId,
        category: integrationData.category || 'integration',
        description: integrationData.description || '',
        flow_summary: integrationData.flow_summary || '',
        flow_implementation: integrationData.flow_implementation || '',
        flow_constants: integrationData.flow_constants || '',
        pom_dependencies: integrationData.pom_dependencies || '',
        compilation_check: integrationData.compilation_check || '',
      };
      
      setSelectedTask(integrationTask);
      
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
    flow_summary?: string;
    flow_implementation?: string;
    flow_constants?: string;
    pom_dependencies?: string;
    compilation_check?: string;
  }) => {
    try {
      // Generate a unique task_id if not provided
      const taskId = task.task_id || `IG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      if (task.category === 'integration') {
        // Save to integration tasks table
        const taskData = {
          workspace_id: task.workspace_id,
          task_id: taskId,
          task_name: task.task_name,
          input_format: task.input_format,
          input_samples: task.input_samples as Json,
          output_samples: task.output_samples as Json,
          notes: task.notes || '',
          generated_scripts: task.generated_scripts as Json,
          user_id: task.user_id,
          username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
          category: task.category,
          description: task.description || '',
          flow_summary: task.flow_summary || '',
          flow_implementation: task.flow_implementation || '',
          flow_constants: task.flow_constants || '',
          pom_dependencies: task.pom_dependencies || '',
          compilation_check: task.compilation_check || ''
        };

        console.log("Saving integration task:", taskData);
        
        const { data, error } = await typedSupabase
          .from('apl_integration_tasks')
          .insert([taskData])
          .select();
        
        if (error) {
          console.error("Error inserting integration task:", error);
          throw error;
        }
        
        console.log("Integration task saved successfully:", data);
        
        if (data && data.length > 0) {
          toast.success(`Task "${taskData.task_name}" saved successfully!`);
        }
        
      } else {
        // Save to dataweave tasks table
        const taskData = {
          workspace_id: task.workspace_id,
          task_id: taskId,
          task_name: task.task_name,
          input_format: task.input_format,
          input_samples: JSON.parse(JSON.stringify(task.input_samples)) as Json,
          output_samples: JSON.parse(JSON.stringify(task.output_samples)) as Json,
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
      }
      
      // Refresh the task list with the current workspace
      await fetchWorkspaceTasks();
      return { success: true, taskId };
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
