import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface WorkspaceTask {
  id: string;
  task_id: string;
  task_name: string;
  created_at: string;
  workspace_id: string; 
  category: string; // Category of the task (dataweave, raml, integration, munit, sampledata, document, diagram)
  description?: string; // Optional description field
  reference_id?: string; // Reference to the original task
}

export interface TaskDetails {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  created_at: string;
  workspace_id: string;
  description?: string;
  input_format?: string;
  input_samples?: any[];
  output_samples?: any[];
  notes?: string;
  generated_scripts?: any[];
  raml_content?: string;
  api_name?: string;
  api_version?: string;
  base_uri?: string;
  documentation?: string;
  flow_implementation?: string;
  flow_description?: string;
  munit_content?: string;
  runtime?: string;
  number_of_scenarios?: number;
  source_format?: string;
  schema_content?: string;
  result_content?: string;
  document_type?: string;
  source_type?: string;
  code?: string;
  flow_diagram?: string;
  connection_steps?: string;
  endpoints?: any[];
  reference_id?: string;
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

  // Fetch workspace tasks from the consolidated table
  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching workspace tasks for workspace:', workspaceId);
      
      // Use the RPC function that queries the consolidated table
      const { data, error } = await supabase.rpc('apl_get_workspace_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) throw error;
      
      const workspaceTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id || `T-${task.id.substring(0, 8).toUpperCase()}`,
        task_name: task.task_name || 'Untitled Task',
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: task.category || 'dataweave',
        description: task.description || '',
        reference_id: task.reference_id
      }));
      
      // Sort tasks by creation date (newest first)
      const sortedTasks = workspaceTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTasks(sortedTasks);
      console.log('Total tasks loaded:', sortedTasks.length);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      // toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  // Keep existing task details fetch mechanism for backward compatibility
  const fetchTaskDetails = useCallback(async (taskId: string) => {
    if (!user || !workspaceId) {
      setError('You must be logged in and have a workspace selected to view task details');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First, find the task in our local state to determine its category
      const task = tasks.find(t => t.id === taskId || t.task_id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Use RPC function to get task details
      const { data, error } = await supabase.rpc('apl_get_task_details', {
        task_id_param: task.reference_id || task.id,
        category_param: task.category
      });
      
      if (error) throw error;
      
      if (data) {
        console.log('Found task details:', data);
        setSelectedTask({
          ...data,
          category: task.category
        });
      } else {
        setSelectedTask(null);
      }
    } catch (err: any) {
      console.error('Error fetching task details:', err);
      setError(err.message);
      // toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user, tasks]);

  // Keep existing deleteTask with the updated RPC function that handles deletion across tables
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      console.log('Deleting task:', taskId);
      
      const taskToDelete = tasks.find(t => t.task_id === taskId || t.id === taskId);
      
      if (!taskToDelete) {
        throw new Error('Task not found');
      }
      
      // Use RPC function to delete from original table which will trigger deletion from workspace_tasks
      const { error } = await supabase.rpc('apl_delete_task', {
        task_id_param: taskToDelete.reference_id || taskToDelete.id,
        category_param: taskToDelete.category
      });
      
      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
      
      console.log('Task deleted successfully');
      
      // Update local state
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      
    } catch (error: any) {
      console.error('Error deleting task:', error);
      // toast.error('Failed to delete task');
      throw error;
    }
  }, [tasks]);

  // The save functions should remain mostly the same since our triggers will handle
  // the synchronization with the workspace_tasks table
  const saveDocumentTask = async (documentData: any) => {
    try {
      const taskId = documentData.id || uuidv4();
      
      const { data, error } = await supabase
        .from('apl_document_tasks')
        .insert([
          {
            task_id: `DOC-${taskId.substring(0, 8)}`,
            task_name: documentData.task_name || 'Document Task',
            workspace_id: workspaceId,
            user_id: user?.id,
            description: documentData.description || '',
            document_type: documentData.document_type || '',
            source_type: documentData.source_type || '',
            code: documentData.code || '',
            result_content: documentData.result_content || '',
            category: 'document'
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh tasks after save - the trigger will handle the workspace_tasks table
      await fetchWorkspaceTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error saving document task:', error);
      // toast.error('Failed to save document task');
      throw error;
    }
  };

  const saveDiagramTask = async (diagramData: any) => {
    try {
      const taskId = `DIA-${generateId()}`;
      
      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .insert([
          {
            task_id: taskId,
            task_name: diagramData.task_name || 'Flow Diagram',
            workspace_id: workspaceId,
            user_id: user?.id,
            description: diagramData.description || '',
            raml_content: diagramData.raml_content || '',
            flow_diagram: diagramData.flow_diagram || '',
            connection_steps: diagramData.connection_steps || '',
            result_content: diagramData.result_content || '',
            category: 'diagram'
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh tasks after save - the trigger will handle the workspace_tasks table
      await fetchWorkspaceTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error saving diagram task:', error);
      // toast.error('Failed to save diagram task');
      throw error;
    }
  };

  const saveSampleDataTask = async (sampleDataInfo: any) => {
    try {
      const taskId = `SD-${generateId()}`;
      
      const { data, error } = await supabase.rpc('apl_insert_sample_data_task', {
        workspace_id: workspaceId,
        task_id: taskId,
        task_name: sampleDataInfo.task_name,
        user_id: user?.id,
        description: sampleDataInfo.description || '',
        source_format: sampleDataInfo.source_format || 'JSON',
        schema_content: sampleDataInfo.schema_content || '',
        result_content: sampleDataInfo.result_content || '',
        notes: sampleDataInfo.notes || '',
        category: 'sampledata'
      });
      
      if (error) {
        console.error('Error saving sample data task:', error);
        throw error;
      }
      
      // Refresh tasks after save - the trigger will handle the workspace_tasks table
      await fetchWorkspaceTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error in saveSampleDataTask:', error);
      // toast.error('Failed to save sample data task');
      throw error;
    }
  };

  const saveRamlTask = async (ramlData: any) => {
    try {
      console.log('Saving RAML task:', ramlData);
      
      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .insert({
          task_id: ramlData.task_id,
          task_name: ramlData.task_name,
          workspace_id: ramlData.workspace_id,
          user_id: ramlData.user_id,
          description: ramlData.description || '',
          api_name: ramlData.api_name || '',
          api_version: ramlData.api_version || '',
          base_uri: ramlData.base_uri || '',
          endpoints: ramlData.endpoints || [],
          raml_content: ramlData.raml_content || '',
          documentation: ramlData.documentation || '',
          category: 'raml'
        }).select();
      
      if (error) {
        console.error('Error saving RAML task:', error);
        throw error;
      }
      
      console.log('RAML task saved successfully:', data);
      
      // Refresh tasks after save - the trigger will handle the workspace_tasks table
      await fetchWorkspaceTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error in saveRamlTask:', error);
      // toast.error('Failed to save RAML task');
      throw error;
    }
  };

  const saveMunitTask = async (munitData: any) => {
    try {
      console.log('Saving MUnit task:', munitData);
      
      const { data, error } = await supabase.rpc('apl_insert_munit_task', {
        workspace_id: munitData.workspace_id,
        task_id: munitData.task_id,
        task_name: munitData.task_name,
        user_id: munitData.user_id,
        description: munitData.description || '',
        flow_description: munitData.flow_description || '',
        flow_implementation: munitData.flow_implementation || '',
        munit_content: munitData.munit_content || '',
        runtime: munitData.runtime || '',
        number_of_scenarios: munitData.number_of_scenarios || 1,
        category: 'munit'
      });
      
      if (error) {
        console.error('Error saving MUnit task:', error);
        throw error;
      }
      
      console.log('MUnit task saved successfully:', data);
      
      // Refresh tasks after save - the trigger will handle the workspace_tasks table
      await fetchWorkspaceTasks();
      
      return data;
    } catch (error: any) {
      console.error('Error in saveMunitTask:', error);
      // toast.error('Failed to save MUnit task');
      throw error;
    }
  };

  // Helper to generate short IDs
  const generateId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Initial fetch when the component mounts
  useEffect(() => {
    if (workspaceId && user) {
      fetchWorkspaceTasks();
    }
  }, [workspaceId, user, fetchWorkspaceTasks]);

  // Set up realtime subscription for workspace_tasks changes
  useEffect(() => {
    if (!workspaceId || !user) return;
    
    const channel = supabase
      .channel('workspace_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apl_workspace_tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          console.log('Workspace tasks changed, refreshing');
          fetchWorkspaceTasks();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user, fetchWorkspaceTasks]);

  return {
    tasks,
    selectedTask,
    loading,
    error,
    fetchTaskDetails,
    fetchWorkspaceTasks,
    saveDocumentTask,
    saveDiagramTask,
    saveSampleDataTask,
    saveRamlTask,
    saveMunitTask,
    deleteTask
  };
};
