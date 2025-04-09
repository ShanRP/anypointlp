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
  input_format?: string;
  input_samples?: any[];
  output_samples?: any[];
  notes?: string;
  generated_scripts?: any[];
  created_at: string;
  workspace_id: string;
  category: string; // Category of the task
  description?: string; // Optional description field
  
  // RAML specific properties
  api_name?: string;
  api_version?: string;
  base_uri?: string;
  endpoints?: any[];
  raml_content?: string;
  documentation?: string;
  
  // MUnit specific properties
  flow_implementation?: string;
  runtime?: string;
  scenario_count?: number;
  generated_tests?: string;
}

export interface IntegrationGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

export interface RAMLGeneratorPayload {
  workspace_id: string;
  task_id?: string;
  task_name: string;
  user_id: string;
  description?: string;
  raml_content?: string;
  api_name?: string;
  api_version?: string;
  base_uri?: string;
  endpoints?: any;
  documentation?: string;
  category: "raml";
}

export interface MUnitGeneratorPayload {
  workspace_id: string;
  task_id?: string;
  task_name: string;
  user_id: string;
  description?: string;
  notes?: string;
  flow_implementation: string;
  runtime: string;
  scenario_count: number;
  generated_tests: string;
  category: "munit";
}

export const useWorkspaceTasks = (workspaceId: string) => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchIntegrationTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching integration tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching integration tasks:', error);
        throw error;
      }
      
      const integrationTasks = (data || []).map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'integration',
        description: task.description || ''
      }));
      
      console.log('Fetched integration tasks:', integrationTasks.length);
      return integrationTasks;
    } catch (err: any) {
      console.error('Error in fetchIntegrationTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchRamlTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching RAML tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase.rpc('apl_get_raml_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) {
        console.error('Error fetching RAML tasks:', error);
        throw error;
      }
      
      const ramlTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'raml',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched RAML tasks:', ramlTasks.length);
      return ramlTasks;
    } catch (err: any) {
      console.error('Error in fetchRamlTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchMUnitTasks = useCallback(async () => {
    if (!workspaceId) return [];
    
    try {
      console.log('Fetching MUnit tasks for workspace:', workspaceId);
      
      const { data, error } = await supabase.rpc('apl_get_munit_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) {
        console.error('Error fetching MUnit tasks:', error);
        throw error;
      }
      
      const munitTasks = Array.isArray(data) ? data.map((task: any) => ({
        id: task.id,
        task_id: task.task_id,
        task_name: task.task_name,
        created_at: task.created_at,
        workspace_id: workspaceId,
        category: 'munit',
        description: task.description || ''
      })) : [];
      
      console.log('Fetched MUnit tasks:', munitTasks.length);
      return munitTasks;
    } catch (err: any) {
      console.error('Error in fetchMUnitTasks:', err);
      return [];
    }
  }, [workspaceId]);

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('apl_get_workspace_tasks', { 
        workspace_id_param: workspaceId 
      });
      
      if (error) throw error;
      
      const workspaceTasks = (data as Array<{
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
      
      const integrationTasks = await fetchIntegrationTasks();
      const ramlTasks = await fetchRamlTasks();
      const munitTasks = await fetchMUnitTasks();
      
      const allTasks = [...workspaceTasks, ...integrationTasks, ...ramlTasks, ...munitTasks].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTasks(allTasks);
      console.log('Total tasks loaded:', allTasks.length);
    } catch (err: any) {
      console.error('Error fetching workspace tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, fetchIntegrationTasks, fetchRamlTasks, fetchMUnitTasks]);

  const fetchIntegrationTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching integration task details for:', taskId);
      
      let { data, error } = await supabase
        .from('apl_integration_tasks')
        .select('*')
        .eq('task_id', taskId)
        .limit(1);
      
      if ((!data || data.length === 0) && taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Task not found by task_id, trying UUID:', taskId);
        ({ data, error } = await supabase
          .from('apl_integration_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      }
      
      if (error) {
        console.error('Error fetching integration task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const integrationTask = data[0];
        console.log('Found task in integration tasks table');
        
        const taskDetails: TaskDetails = {
          id: integrationTask.id,
          task_id: integrationTask.task_id,
          task_name: integrationTask.task_name || 'Integration Flow',
          input_format: 'Flow Specification',
          input_samples: [{ id: 'input1', value: integrationTask.description, isValid: true }],
          output_samples: [],
          notes: integrationTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: integrationTask.generated_code || '',
          }],
          created_at: integrationTask.created_at,
          workspace_id: workspaceId,
          category: 'integration',
          description: integrationTask.description || ''
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchIntegrationTaskDetails:', err);
      return null;
    }
  };

  const fetchRamlTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching RAML task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for RAML task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_raml_tasks')
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for RAML task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_raml_tasks')
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
      }
      
      if (error) {
        console.error('Error fetching RAML task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const ramlTask = data[0];
        console.log('Found task in RAML tasks table');
        
        const taskDetails: TaskDetails = {
          id: ramlTask.id,
          task_id: ramlTask.task_id,
          task_name: ramlTask.task_name || 'RAML Specification',
          input_format: 'RAML Specification',
          input_samples: [],
          output_samples: [],
          notes: ramlTask.description || '',
          generated_scripts: [{
            id: `script-${Date.now()}`,
            code: ramlTask.raml_content || '',
          }],
          created_at: ramlTask.created_at,
          workspace_id: workspaceId,
          category: 'raml',
          description: ramlTask.description || '',
          api_name: ramlTask.api_name,
          api_version: ramlTask.api_version,
          base_uri: ramlTask.base_uri,
          endpoints: ramlTask.endpoints,
          raml_content: ramlTask.raml_content,
          documentation: ramlTask.documentation
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchRamlTaskDetails:', err);
      return null;
    }
  };
  
  const fetchMUnitTaskDetails = async (taskId: string) => {
    try {
      console.log('Fetching MUnit task details for:', taskId);
      
      let data;
      let error;
      
      const isUuid = taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuid) {
        console.log('Using UUID for MUnit task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_munit_tasks' as any)
          .select('*')
          .eq('id', taskId)
          .limit(1));
      } else {
        console.log('Using task_id for MUnit task lookup:', taskId);
        ({ data, error } = await supabase
          .from('apl_munit_tasks' as any)
          .select('*')
          .eq('task_id', taskId)
          .limit(1));
      }
      
      if (error) {
        console.error('Error fetching MUnit task details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const munitTask = data[0];
        console.log('Found task in MUnit tasks table');
        
        const taskDetails: TaskDetails = {
          id: munitTask.id,
          task_id: munitTask.task_id,
          task_name: munitTask.task_name || 'MUnit Test Suite',
          input_format: 'Flow Implementation',
          input_samples: [],
          output_samples: [],
          notes: munitTask.notes || '',
          created_at: munitTask.created_at,
          workspace_id: workspaceId,
          category: 'munit',
          description: munitTask.description || '',
          flow_implementation: munitTask.flow_implementation,
          runtime: munitTask.runtime,
          scenario_count: munitTask.scenario_count,
          generated_tests: munitTask.generated_tests
        };
        
        setSelectedTask(taskDetails);
        return taskDetails;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error in fetchMUnitTaskDetails:', err);
      return null;
    }
  };

  const fetchTaskDetails = async (taskId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const integrationTaskDetails = await fetchIntegrationTaskDetails(taskId);
      
      if (integrationTaskDetails) {
        console.log('Found task in integration tasks table');
        return;
      }
      
      const ramlTaskDetails = await fetchRamlTaskDetails(taskId);
      
      if (ramlTaskDetails) {
        console.log('Found task in RAML tasks table');
        return;
      }
      
      const munitTaskDetails = await fetchMUnitTaskDetails(taskId);
      
      if (munitTaskDetails) {
        console.log('Found task in MUnit tasks table');
        return;
      }
      
      console.log('Task not found in integration, RAML, or MUnit tasks, checking regular tasks');
      
      const { data, error } = await supabase.rpc('apl_get_task_details', { 
        task_id_param: taskId 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
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
        console.log('Found task in regular tasks table');
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
      const taskId = task.task_id || `T-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
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
      
      await fetchWorkspaceTasks();
      return data;
    } catch (err: any) {
      console.error('Error saving task:', err);
      toast.error('Failed to save task');
      throw err;
    }
  };

  const saveRamlTask = async (task: RAMLGeneratorPayload) => {
    try {
      const taskId = task.task_id || `R-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        raml_content: task.raml_content || '',
        api_name: task.api_name || '',
        api_version: task.api_version || '',
        base_uri: task.base_uri || '',
        endpoints: task.endpoints || [],
        documentation: task.documentation || '',
        category: 'raml'
      };

      const { data, error } = await supabase
        .from('apl_raml_tasks')
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('RAML task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving RAML task:', err);
      toast.error('Failed to save RAML task');
      throw err;
    }
  };
  
  const saveMUnitTask = async (task: MUnitGeneratorPayload) => {
    try {
      const taskId = task.task_id || `M-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      const taskData = {
        workspace_id: task.workspace_id,
        task_id: taskId,
        task_name: task.task_name,
        user_id: task.user_id,
        description: task.description || '',
        notes: task.notes || '',
        flow_implementation: task.flow_implementation,
        runtime: task.runtime,
        scenario_count: task.scenario_count,
        generated_tests: task.generated_tests,
        category: 'munit'
      };

      const { data, error } = await supabase
        .from('apl_munit_tasks' as any)
        .insert([taskData])
        .select();
      
      if (error) throw error;
      
      await fetchWorkspaceTasks();
      
      toast.success('MUnit task saved successfully!');
      return data;
    } catch (err: any) {
      console.error('Error saving MUnit task:', err);
      toast.error('Failed to save MUnit task');
      throw err;
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceTasks();
    } else {
      setTasks([]);
    }
  }, [workspaceId, fetchWorkspaceTasks]);

  return {
    tasks,
    selectedTask,
    loading,
    error,
    fetchWorkspaceTasks,
    fetchTaskDetails,
    saveTask,
    saveRamlTask,
    saveMUnitTask
  };
};
