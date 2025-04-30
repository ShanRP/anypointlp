import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskDetails, WorkspaceTask } from '@/types';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandler';

export const useWorkspaceTasks = () => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  const fetchWorkspaceTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!workspaceId) {
        setTasks([]);
        return;
      }
      const { data, error } = await supabase
        .from('apl_workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        toast.error(`Error fetching tasks: ${error.message}`);
      } else {
        setTasks(data || []);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('apl_workspace_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        setError(error.message);
        toast.error(`Error fetching task details: ${error.message}`);
      } else {
        setSelectedTask(data || null);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

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
