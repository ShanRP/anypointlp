import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export type WorkspaceTask = {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  created_at: string;
  description?: string;
};

export type TaskDetails = {
  id: string;
  task_id: string;
  task_name: string;
  category: string;
  description?: string;
  created_at: string;
  [key: string]: any; // For additional fields specific to each task type
};

export function useWorkspaceTasks(workspaceId: string) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [taskDetailsLoading, setTaskDetailsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('apl_get_workspace_tasks', {
          workspace_id_param: workspaceId
        });

      if (error) throw error;

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching workspace tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  useEffect(() => {
    if (workspaceId && user) {
      fetchWorkspaceTasks();
    }
  }, [fetchWorkspaceTasks, workspaceId, user]);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    setTaskDetailsLoading(true);
    try {
      // First find task in the tasks list to get category
      const task = tasks.find(t => t.task_id === taskId || t.id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }

      console.log(`Fetching task details for ${task.category} task: ${taskId}`);

      let data;
      let error;

      switch (task.category) {
        case 'dataweave':
          ({ data, error } = await supabase
            .from('apl_dataweave_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        case 'integration':
          ({ data, error } = await supabase
            .from('apl_integration_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        case 'raml':
          ({ data, error } = await supabase
            .from('apl_raml_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        case 'munit':
          ({ data, error } = await supabase
            .from('apl_munit_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        case 'sampledata':
          ({ data, error } = await supabase
            .from('apl_sample_data_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        case 'document':
          ({ data, error } = await supabase
            .from('apl_document_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        case 'diagram':
          ({ data, error } = await supabase
            .from('apl_diagram_tasks')
            .select('*')
            .eq('task_id', taskId)
            .maybeSingle());
          break;
        default:
          throw new Error(`Unknown task category: ${task.category}`);
      }

      if (error) throw error;

      if (data) {
        setSelectedTask({
          ...data,
          category: task.category // Ensure we include the category
        });
      } else {
        throw new Error(`Task ${taskId} not found`);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error('Failed to load task details');
    } finally {
      setTaskDetailsLoading(false);
    }
  }, [tasks]);

  const saveDiagramTask = async (diagramData: any) => {
    if (!user) {
      toast.error('You must be logged in to save a diagram task');
      return null;
    }

    try {
      const taskId = diagramData.task_id || `diagram-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_diagram_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: diagramData.task_name || 'Untitled Diagram',
          workspace_id: diagramData.workspace_id || workspaceId,
          description: diagramData.description || '',
          raml_content: diagramData.raml_content || '',
          flow_diagram: diagramData.flow_diagram || '',
          connection_steps: diagramData.connection_steps || '',
          result_content: diagramData.result_content || ''
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving diagram task:', error);
      toast.error('Failed to save diagram task');
      return null;
    }
  };

  const saveDataWeaveTask = async (taskData: any) => {
    if (!user) {
      toast.error('You must be logged in to save a dataweave task');
      return null;
    }

    try {
      const taskId = taskData.task_id || `dataweave-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_dataweave_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: taskData.task_name || 'Untitled DataWeave Task',
          workspace_id: taskData.workspace_id || workspaceId,
          input_data: taskData.input_data || '',
          output_data: taskData.output_data || '',
          dataweave_code: taskData.dataweave_code || '',
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving dataweave task:', error);
      toast.error('Failed to save dataweave task');
      return null;
    }
  };

  const saveIntegrationTask = async (integrationData: any) => {
    if (!user) {
      toast.error('You must be logged in to save an integration task');
      return null;
    }

    try {
      const taskId = integrationData.task_id || `integration-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_integration_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: integrationData.task_name || 'Untitled Integration Task',
          workspace_id: integrationData.workspace_id || workspaceId,
          description: integrationData.description || '',
          flow_code: integrationData.flow_code || '',
          flow_diagram: integrationData.flow_diagram || '',
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving integration task:', error);
      toast.error('Failed to save integration task');
      return null;
    }
  };

  const saveRAMLTask = async (ramlData: any) => {
    if (!user) {
      toast.error('You must be logged in to save a RAML task');
      return null;
    }

    try {
      const taskId = ramlData.task_id || `raml-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: ramlData.task_name || 'Untitled RAML Task',
          workspace_id: ramlData.workspace_id || workspaceId,
          raml_content: ramlData.raml_content || '',
          api_name: ramlData.api_name || '',
          api_version: ramlData.api_version || '',
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving RAML task:', error);
      toast.error('Failed to save RAML task');
      return null;
    }
  };

  const saveMunitTask = async (munitData: any) => {
    if (!user) {
      toast.error('You must be logged in to save a MUnit task');
      return null;
    }

    try {
      const taskId = munitData.task_id || `munit-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_munit_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: munitData.task_name || 'Untitled MUnit Task',
          workspace_id: munitData.workspace_id || workspaceId,
          flow_code: munitData.flow_code || '',
          munit_code: munitData.munit_code || '',
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving MUnit task:', error);
      toast.error('Failed to save MUnit task');
      return null;
    }
  };

  const saveSampleDataTask = async (sampleDataTask: any) => {
    if (!user) {
      toast.error('You must be logged in to save a Sample Data task');
      return null;
    }

    try {
      const taskId = sampleDataTask.task_id || `sampledata-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_sample_data_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: sampleDataTask.task_name || 'Untitled Sample Data Task',
          workspace_id: sampleDataTask.workspace_id || workspaceId,
          dataweave_code: sampleDataTask.dataweave_code || '',
          sample_data: sampleDataTask.sample_data || '',
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving Sample Data task:', error);
      toast.error('Failed to save Sample Data task');
      return null;
    }
  };

  const saveDocumentTask = async (documentData: any) => {
    if (!user) {
      toast.error('You must be logged in to save a Document task');
      return null;
    }

    try {
      const taskId = documentData.task_id || `document-${uuidv4().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('apl_document_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_name: documentData.task_name || 'Untitled Document Task',
          workspace_id: documentData.workspace_id || workspaceId,
          content_uri: documentData.content_uri || '',
          document_content: documentData.document_content || '',
        })
        .select()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh workspace tasks
      fetchWorkspaceTasks();
      
      return data;
    } catch (error) {
      console.error('Error saving Document task:', error);
      toast.error('Failed to save Document task');
      return null;
    }
  };

  return {
    tasks,
    loading,
    fetchWorkspaceTasks,
    selectedTask,
    fetchTaskDetails,
    taskDetailsLoading,
    saveDataWeaveTask,
    saveIntegrationTask,
    saveRAMLTask,
    saveMunitTask,
    saveSampleDataTask,
    saveDocumentTask,
    saveDiagramTask
  };
}
