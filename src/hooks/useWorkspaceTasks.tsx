
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskDetails, WorkspaceTask } from '@/types';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandler';

export { TaskDetails, WorkspaceTask };

export const useWorkspaceTasks = (workspaceIdParam: string = '') => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState(workspaceIdParam);

  const fetchWorkspaceTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!workspaceId) {
        setTasks([]);
        return [];
      }
      
      // Use RPC function to get workspace tasks
      const { data, error: fetchError } = await supabase
        .rpc('apl_get_workspace_tasks', { workspace_id_param: workspaceId });

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Error fetching tasks: ${fetchError.message}`);
        return [];
      } else {
        setTasks(data || []);
        return data || [];
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    setLoading(true);
    setError('');
    try {
      // For task details, we need to determine the task type first
      const taskInState = tasks.find(t => t.id === taskId);
      
      if (!taskInState) {
        throw new Error("Task not found");
      }
      
      // Based on category, fetch from appropriate table
      const category = taskInState.category;
      let table = '';
      
      switch(category) {
        case 'dataweave':
          table = 'apl_dataweave_tasks';
          break;
        case 'integration':
          table = 'apl_integration_tasks';
          break;
        case 'raml':
          table = 'apl_raml_tasks';
          break;
        case 'munit':
          table = 'apl_munit_tasks';
          break;
        case 'sampledata':
          table = 'apl_sample_data_tasks';
          break;
        case 'document':
          table = 'apl_document_tasks';
          break;
        case 'diagram':
          table = 'apl_diagram_tasks';
          break;
        default:
          throw new Error(`Unknown task category: ${category}`);
      }
      
      const { data, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Error fetching task details: ${fetchError.message}`);
      } else {
        setSelectedTask(data || null);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  const selectTask = (task: TaskDetails) => {
    setSelectedTask(task);
  };

  const clearSelectedTask = () => {
    setSelectedTask(null);
  };

  const createTask = async (
    title: string,
    description: string,
    code: string,
    type: string,
    status: string,
  ) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('apl_workspace_tasks')
        .insert([
          {
            title,
            description,
            code,
            type,
            status,
            workspace_id: workspaceId,
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        toast.error(`Error creating task: ${error.message}`);
      } else {
        setTasks((prevTasks) => [data, ...prevTasks]);
        toast.success('Task created successfully!');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<WorkspaceTask>
  ) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('apl_workspace_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        setError(error.message);
        toast.error(`Error updating task: ${error.message}`);
      } else {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, ...data } : task))
        );
        setSelectedTask(data || null);
        toast.success('Task updated successfully!');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('apl_workspace_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        setError(error.message);
        toast.error(`Error deleting task: ${error.message}`);
      } else {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        setSelectedTask(null);
        toast.success('Task deleted successfully!');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add the isLoading property as an alias for loading to maintain compatibility
  return {
    tasks,
    selectedTask,
    loading,
    isLoading: loading, // Add alias to maintain compatibility
    error,
    fetchTaskDetails,
    fetchWorkspaceTasks,
    selectTask,
    clearSelectedTask,
    createTask,
    updateTask,
    deleteTask,
    setWorkspaceId,
  };
};
